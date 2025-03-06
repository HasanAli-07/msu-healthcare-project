from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required, get_jwt
import os
import mysql.connector
from sqlalchemy import text

app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# JWT Configuration
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this to a secure key in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['JWT_ERROR_MESSAGE_KEY'] = 'error'
jwt = JWTManager(app)

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        'status': 'error',
        'message': 'Invalid token',
        'error': str(error)
    }), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    return jsonify({
        'status': 'error',
        'message': 'Token has expired',
        'error': 'token_expired'
    }), 401

@jwt.unauthorized_loader
def unauthorized_callback(error):
    return jsonify({
        'status': 'error',
        'message': 'Missing Authorization Header',
        'error': str(error)
    }), 401

# MySQL Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@localhost/healthcare'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='patient')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Doctor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    specialization = db.Column(db.String(100))
    qualification = db.Column(db.String(200))
    experience_years = db.Column(db.Integer)
    consultation_fee = db.Column(db.Float)
    available_days = db.Column(db.String(200))  # Stored as JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('doctor_profile', uselist=False))
    appointments = db.relationship('Appointment', backref='doctor', foreign_keys='Appointment.doctor_id')

class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    blood_group = db.Column(db.String(10))
    weight = db.Column(db.Float)
    height = db.Column(db.Float)
    medical_history = db.Column(db.Text)
    allergies = db.Column(db.Text)
    emergency_contact = db.Column(db.String(100))
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('patient_profile', uselist=False))
    appointments = db.relationship('Appointment', backref='patient', foreign_keys='Appointment.patient_id')
    prescriptions = db.relationship('Prescription', backref='patient')

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')
    symptoms = db.Column(db.Text)
    diagnosis = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Prescription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointment.id'))
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    medications = db.Column(db.Text)  # Stored as JSON string
    dosage_instructions = db.Column(db.Text)
    duration = db.Column(db.String(100))
    additional_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    appointment = db.relationship('Appointment', backref='prescriptions')
    doctor = db.relationship('Doctor', backref='prescriptions')

# Add these models after other models
class PatientFlow(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    time_slot = db.Column(db.String(10), nullable=False)
    patient_count = db.Column(db.Integer, default=0)
    date = db.Column(db.Date, nullable=False)
    
    doctor = db.relationship('Doctor', backref='patient_flows')

class DiseaseDistribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    disease_name = db.Column(db.String(100), nullable=False)
    patient_count = db.Column(db.Integer, default=0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    doctor = db.relationship('Doctor', backref='disease_distributions')

# Create tables
with app.app_context():
    db.create_all()

# Routes
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        print("Received signup data:", data)
        if not data:
            return jsonify({'error': 'No data received'}), 400
        required_fields = ['username', 'email', 'password', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 400
        new_user = User(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            role=data['role']
        )
        db.session.add(new_user)
        db.session.flush()
        if data['role'] == 'doctor':
            doctor_profile = Doctor(
                user_id=new_user.id,
                specialization=data.get('specialization', ''),
                qualification=data.get('qualification', ''),
                experience_years=data.get('experience_years', 0),
                consultation_fee=data.get('consultation_fee', 0.0),
                available_days=data.get('available_days', '[]')
            )
            db.session.add(doctor_profile)
        else:
            patient_profile = Patient(
                user_id=new_user.id,
                age=data.get('age'),
                gender=data.get('gender'),
                blood_group=data.get('blood_group'),
                weight=data.get('weight'),
                height=data.get('height'),
                medical_history=data.get('medical_history', ''),
                allergies=data.get('allergies', ''),
                emergency_contact=data.get('emergency_contact', ''),
                address=data.get('address', '')
            )
            db.session.add(patient_profile)
        db.session.commit()
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'role': new_user.role
            }
        }), 201
    except Exception as e:
        print("Signup error:", str(e))
        db.session.rollback()
        return jsonify({'error': f'Signup failed: {str(e)}'}), 400

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Missing email or password'}), 400
        user = User.query.filter_by(email=data['email']).first()
        if user and user.password == data['password']:
            access_token = create_access_token(
                identity=str(user.id),
                additional_claims={
                    'email': user.email,
                    'role': user.role,
                    'username': user.username
                }
            )
            return jsonify({
                'message': 'Login successful',
                'token': access_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role
                }
            }), 200
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Default response data
        response_data = {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            },
            "appointments": 0,
            "total_appointments": 0,
            "prescriptions": 0,
            "totalPatients": 0,
            "visits": {
                "daily": 0,
                "monthly": 0,
                "yearly": 0
            }
        }

        # Add role-specific data
        if user.role == 'doctor':
            # Get doctor's profile
            doctor = Doctor.query.filter_by(user_id=user.id).first()
            if doctor:
                # Count appointments
                response_data["appointments"] = Appointment.query.filter_by(
                    doctor_id=doctor.id,
                    appointment_date=datetime.utcnow().date()
                ).count()
                response_data["total_appointments"] = Appointment.query.filter_by(
                    doctor_id=doctor.id
                ).count()
                # Count prescriptions
                response_data["prescriptions"] = Prescription.query.filter_by(
                    doctor_id=doctor.id
                ).count()
                # Count total patients
                response_data["totalPatients"] = Patient.query.join(Appointment).filter(
                    Appointment.doctor_id == doctor.id
                ).distinct().count()
                # Count visits
                today = datetime.utcnow().date()
                this_month = today.replace(day=1)
                this_year = today.replace(month=1, day=1)
                response_data["visits"] = {
                    "daily": Appointment.query.filter_by(
                        doctor_id=doctor.id,
                        appointment_date=today
                    ).count(),
                    "monthly": Appointment.query.filter(
                        Appointment.doctor_id == doctor.id,
                        Appointment.appointment_date >= this_month
                    ).count(),
                    "yearly": Appointment.query.filter(
                        Appointment.doctor_id == doctor.id,
                        Appointment.appointment_date >= this_year
                    ).count()
                }
        else:
            # Get patient's profile
            patient = Patient.query.filter_by(user_id=user.id).first()
            if patient:
                # Count upcoming appointments
                response_data["appointments"] = Appointment.query.filter(
                    Appointment.patient_id == patient.id,
                    Appointment.appointment_date >= datetime.utcnow()
                ).count()
                response_data["total_appointments"] = Appointment.query.filter_by(
                    patient_id=patient.id
                ).count()
                # Count prescriptions
                response_data["prescriptions"] = Prescription.query.filter_by(
                    patient_id=patient.id
                ).count()
                # Add patient info
                response_data["patient_info"] = {
                    "age": patient.age,
                    "gender": patient.gender,
                    "weight": patient.weight,
                    "height": patient.height
                }

        return jsonify(response_data), 200

    except Exception as e:
        print("Error in dashboard:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/patient-info', methods=['POST'])
@jwt_required()
def save_patient_info():
    current_user_id = get_jwt_identity()
    data = request.json
    
    try:
        # Check if patient info exists
        patient_info = Patient.query.filter_by(user_id=current_user_id).first()
        
        if patient_info:
            # Update existing info
            for key, value in data.items():
                setattr(patient_info, key, value)
            patient_info.updated_at = datetime.utcnow()
        else:
            # Create new patient info
            patient_info = Patient(
                user_id=current_user_id,
                age=data.get('age'),
                gender=data.get('gender'),
                weight=data.get('weight'),
                height=data.get('height'),
                address=data.get('address')
            )
            db.session.add(patient_info)
            
        db.session.commit()
        return jsonify({
            'message': 'Patient information saved successfully',
            'data': {
                'age': patient_info.age,
                'gender': patient_info.gender,
                'weight': patient_info.weight,
                'height': patient_info.height,
                'address': patient_info.address
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/appointments', methods=['POST'])
def create_appointment():
    data = request.json
    try:
        appointment = Appointment(
            patient_id=data['patient_id'],
            doctor_id=data['doctor_id'],
            appointment_date=datetime.strptime(data['appointment_date'], '%Y-%m-%d %H:%M'),
            symptoms=data.get('symptoms', ''),
            diagnosis=data.get('diagnosis', ''),
            notes=data.get('notes', '')
        )
        db.session.add(appointment)
        db.session.commit()
        return jsonify({'message': 'Appointment created successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/appointments/<int:user_id>', methods=['GET'])
def get_appointments(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.role == 'doctor':
        appointments = Appointment.query.filter_by(doctor_id=user_id).all()
    else:
        appointments = Appointment.query.filter_by(patient_id=user_id).all()
    
    return jsonify({
        'appointments': [{
            'id': apt.id,
            'appointment_date': apt.appointment_date.strftime('%Y-%m-%d %H:%M'),
            'status': apt.status,
            'symptoms': apt.symptoms,
            'diagnosis': apt.diagnosis,
            'notes': apt.notes
        } for apt in appointments]
    }), 200

@app.route('/api/doctor/profile', methods=['GET', 'PUT'])
@jwt_required()
def doctor_profile():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'doctor':
            return jsonify({"error": "Unauthorized access"}), 401

        doctor = Doctor.query.filter_by(user_id=user.id).first()
        
        if request.method == 'GET':
            if not doctor:
                return jsonify({
                    "specialization": "",
                    "qualification": "",
                    "experience_years": 0,
                    "consultation_fee": 0,
                    "available_days": []
                }), 200
                
            try:
                available_days = eval(doctor.available_days) if doctor.available_days else []
            except:
                available_days = []
                
            return jsonify({
                "specialization": doctor.specialization or "",
                "qualification": doctor.qualification or "",
                "experience_years": doctor.experience_years or 0,
                "consultation_fee": doctor.consultation_fee or 0,
                "available_days": available_days
            }), 200
            
        elif request.method == 'PUT':
            try:
                data = request.get_json()
                print("Received profile data:", data)
                
                if not doctor:
                    doctor = Doctor(
                        user_id=user.id,
                        specialization="",
                        qualification="",
                        experience_years=0,
                        consultation_fee=0,
                        available_days="[]"
                    )
                    db.session.add(doctor)
                
                # Validate and update doctor profile
                doctor.specialization = str(data.get('specialization', "")).strip()
                doctor.qualification = str(data.get('qualification', "")).strip()
                doctor.experience_years = int(data.get('experience_years', 0))
                doctor.consultation_fee = float(data.get('consultation_fee', 0))
                
                # Handle available days
                available_days = data.get('available_days', [])
                if isinstance(available_days, list):
                    doctor.available_days = str(available_days)
                else:
                    doctor.available_days = "[]"
                
                doctor.updated_at = datetime.utcnow()
                
                db.session.commit()
                print("Profile updated successfully")
                
                return jsonify({
                    "message": "Profile updated successfully",
                    "data": {
                        "specialization": doctor.specialization,
                        "qualification": doctor.qualification,
                        "experience_years": doctor.experience_years,
                        "consultation_fee": doctor.consultation_fee,
                        "available_days": eval(doctor.available_days) if doctor.available_days else []
                    }
                }), 200
                
            except Exception as e:
                db.session.rollback()
                print("Error updating profile:", str(e))
                return jsonify({"error": f"Failed to update profile: {str(e)}"}), 400
            
    except Exception as e:
        print("Error in doctor profile:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/doctor/charts', methods=['GET'])
@jwt_required()
def get_chart_data():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'doctor':
            return jsonify({'error': 'Unauthorized access'}), 401
            
        doctor = Doctor.query.filter_by(user_id=user.id).first()
        if not doctor:
            return jsonify({'error': 'Doctor not found'}), 404
            
        # Get today's date
        today = datetime.now().date()
        
        # Get patient flow data
        patient_flows = PatientFlow.query.filter_by(
            doctor_id=doctor.id,
            date=today
        ).all()
        
        # If no data exists for today, create default entries
        if not patient_flows:
            time_slots = ['9 AM', '10 AM', '11 AM', '12 PM', '2 PM', '3 PM', '4 PM', '5 PM']
            for slot in time_slots:
                flow = PatientFlow(
                    doctor_id=doctor.id,
                    time_slot=slot,
                    date=today,
                    patient_count=0
                )
                db.session.add(flow)
            db.session.commit()
            patient_flows = PatientFlow.query.filter_by(
                doctor_id=doctor.id,
                date=today
            ).all()
        
        # Get disease distribution data
        disease_dist = DiseaseDistribution.query.filter_by(
            doctor_id=doctor.id
        ).order_by(DiseaseDistribution.patient_count.desc()).limit(5).all()
        
        # If no disease data exists, create default entries
        if not disease_dist:
            diseases = ['Fever', 'Cold & Flu', 'Diabetes', 'Blood Pressure', 'Others']
            for disease in diseases:
                dist = DiseaseDistribution(
                    doctor_id=doctor.id,
                    disease_name=disease,
                    patient_count=0
                )
                db.session.add(dist)
            db.session.commit()
            disease_dist = DiseaseDistribution.query.filter_by(
                doctor_id=doctor.id
            ).order_by(DiseaseDistribution.patient_count.desc()).limit(5).all()
        
        # Format data for frontend
        flow_data = [
            {
                'time': flow.time_slot,
                'patients': flow.patient_count
            } for flow in patient_flows
        ]
        
        disease_data = [
            {
                'name': dist.disease_name,
                'value': dist.patient_count
            } for dist in disease_dist
        ]
        
        return jsonify({
            'patient_flow': flow_data,
            'disease_distribution': disease_data
        })
        
    except Exception as e:
        print(f"Error fetching chart data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/doctor/charts/update', methods=['POST'])
@jwt_required()
def update_chart_data():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'doctor':
            return jsonify({'error': 'Unauthorized access'}), 401
            
        doctor = Doctor.query.filter_by(user_id=user.id).first()
        if not doctor:
            return jsonify({'error': 'Doctor not found'}), 404
            
        data = request.get_json()
        time_slot = data.get('time_slot')
        disease_name = data.get('disease_name')
        
        if not time_slot or not disease_name:
            return jsonify({'error': 'Missing required data'}), 400
            
        today = datetime.now().date()
        
        # Update patient flow
        flow = PatientFlow.query.filter_by(
            doctor_id=doctor.id,
            date=today,
            time_slot=time_slot
        ).first()
        
        if flow:
            flow.patient_count += 1
        else:
            flow = PatientFlow(
                doctor_id=doctor.id,
                time_slot=time_slot,
                date=today,
                patient_count=1
            )
            db.session.add(flow)
            
        # Update disease distribution
        dist = DiseaseDistribution.query.filter_by(
            doctor_id=doctor.id,
            disease_name=disease_name
        ).first()
        
        if dist:
            dist.patient_count += 1
        else:
            dist = DiseaseDistribution(
                doctor_id=doctor.id,
                disease_name=disease_name,
                patient_count=1
            )
            db.session.add(dist)
            
        db.session.commit()
        
        return jsonify({'message': 'Chart data updated successfully'})
        
    except Exception as e:
        print(f"Error updating chart data: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/patient/profile', methods=['GET', 'PUT'])
@jwt_required()
def patient_profile():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'patient':
            return jsonify({"error": "Unauthorized access"}), 401

        patient = Patient.query.filter_by(user_id=user.id).first()
        
        if request.method == 'GET':
            if not patient:
                return jsonify({
                    "age": 0,
                    "gender": "",
                    "blood_group": "",
                    "weight": 0,
                    "height": 0,
                    "medical_history": "",
                    "allergies": "",
                    "chronic_diseases": "",
                    "current_medications": "",
                    "family_history": "",
                    "lifestyle_habits": "",
                    "emergency_contact": "",
                    "emergency_contact_relation": "",
                    "address": "",
                    "occupation": "",
                    "marital_status": ""
                }), 200
                
            return jsonify({
                "age": patient.age or 0,
                "gender": patient.gender or "",
                "blood_group": patient.blood_group or "",
                "weight": patient.weight or 0,
                "height": patient.height or 0,
                "medical_history": patient.medical_history or "",
                "allergies": patient.allergies or "",
                "chronic_diseases": patient.chronic_diseases or "",
                "current_medications": patient.current_medications or "",
                "family_history": patient.family_history or "",
                "lifestyle_habits": patient.lifestyle_habits or "",
                "emergency_contact": patient.emergency_contact or "",
                "emergency_contact_relation": patient.emergency_contact_relation or "",
                "address": patient.address or "",
                "occupation": patient.occupation or "",
                "marital_status": patient.marital_status or ""
            }), 200
            
        elif request.method == 'PUT':
            try:
                data = request.get_json()
                
                if not patient:
                    patient = Patient(user_id=user.id)
                    db.session.add(patient)
                
                # Update patient profile
                patient.age = data.get('age', 0)
                patient.gender = data.get('gender', '')
                patient.blood_group = data.get('blood_group', '')
                patient.weight = data.get('weight', 0)
                patient.height = data.get('height', 0)
                patient.medical_history = data.get('medical_history', '')
                patient.allergies = data.get('allergies', '')
                patient.chronic_diseases = data.get('chronic_diseases', '')
                patient.current_medications = data.get('current_medications', '')
                patient.family_history = data.get('family_history', '')
                patient.lifestyle_habits = data.get('lifestyle_habits', '')
                patient.emergency_contact = data.get('emergency_contact', '')
                patient.emergency_contact_relation = data.get('emergency_contact_relation', '')
                patient.address = data.get('address', '')
                patient.occupation = data.get('occupation', '')
                patient.marital_status = data.get('marital_status', '')
                
                patient.updated_at = datetime.utcnow()
                
                db.session.commit()
                
                return jsonify({
                    "message": "Profile updated successfully",
                    "data": {
                        "age": patient.age,
                        "gender": patient.gender,
                        "blood_group": patient.blood_group,
                        "weight": patient.weight,
                        "height": patient.height,
                        "medical_history": patient.medical_history,
                        "allergies": patient.allergies,
                        "chronic_diseases": patient.chronic_diseases,
                        "current_medications": patient.current_medications,
                        "family_history": patient.family_history,
                        "lifestyle_habits": patient.lifestyle_habits,
                        "emergency_contact": patient.emergency_contact,
                        "emergency_contact_relation": patient.emergency_contact_relation,
                        "address": patient.address,
                        "occupation": patient.occupation,
                        "marital_status": patient.marital_status
                    }
                }), 200
                
            except Exception as e:
                db.session.rollback()
                print("Error updating profile:", str(e))
                return jsonify({"error": f"Failed to update profile: {str(e)}"}), 400
            
    except Exception as e:
        print("Error in patient profile:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/patient/vitals', methods=['GET', 'POST'])
@jwt_required()
def patient_vitals():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'patient':
            return jsonify({"error": "Unauthorized access"}), 401

        patient = Patient.query.filter_by(user_id=user.id).first()
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
            
        if request.method == 'GET':
            # Get latest vitals
            vitals = PatientVitals.query.filter_by(
                patient_id=patient.id
            ).order_by(PatientVitals.recorded_at.desc()).first()
            
            if not vitals:
                return jsonify({
                    "blood_pressure": "",
                    "heart_rate": 0,
                    "temperature": 0,
                    "respiratory_rate": 0,
                    "blood_sugar": 0,
                    "recorded_at": None
                }), 200
                
            return jsonify({
                "blood_pressure": vitals.blood_pressure,
                "heart_rate": vitals.heart_rate,
                "temperature": vitals.temperature,
                "respiratory_rate": vitals.respiratory_rate,
                "blood_sugar": vitals.blood_sugar,
                "recorded_at": vitals.recorded_at.isoformat()
            }), 200
            
        elif request.method == 'POST':
            try:
                data = request.get_json()
                
                vitals = PatientVitals(
                    patient_id=patient.id,
                    blood_pressure=data.get('blood_pressure', ''),
                    heart_rate=data.get('heart_rate', 0),
                    temperature=data.get('temperature', 0),
                    respiratory_rate=data.get('respiratory_rate', 0),
                    blood_sugar=data.get('blood_sugar', 0)
                )
                
                db.session.add(vitals)
                db.session.commit()
                
                return jsonify({
                    "message": "Vitals recorded successfully",
                    "data": {
                        "blood_pressure": vitals.blood_pressure,
                        "heart_rate": vitals.heart_rate,
                        "temperature": vitals.temperature,
                        "respiratory_rate": vitals.respiratory_rate,
                        "blood_sugar": vitals.blood_sugar,
                        "recorded_at": vitals.recorded_at.isoformat()
                    }
                }), 201
                
            except Exception as e:
                db.session.rollback()
                print("Error recording vitals:", str(e))
                return jsonify({"error": f"Failed to record vitals: {str(e)}"}), 400
            
    except Exception as e:
        print("Error in patient vitals:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

print("Flask server is running on http://localhost:5000")

