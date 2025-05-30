from flask import Flask, render_template, request, send_file, session, redirect, url_for
from huggingface_hub import InferenceClient
from PIL import Image
import io
import sqlite3

app = Flask(__name__, static_url_path='/static')
app.secret_key = 'your_secret_key_here'  # Required for sessions

# Initialize client
client = InferenceClient(
    provider="your_inference",
    api_key="your_secret_key"
)

# Database setup
def get_db():
    db = sqlite3.connect('users.db')
    db.row_factory = sqlite3.Row
    return db

# Initialize the database
with get_db() as db:
    db.execute('''CREATE TABLE IF NOT EXISTS users
                 (username text, email text, password text)''')
    db.execute("CREATE TABLE IF NOT EXISTS contact_messages (name TEXT, email TEXT, subject TEXT, message TEXT)")

    db.commit()

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        if 'generate_count' not in session:
            session['generate_count'] = 0
        
        # Increment generation count
        session['generate_count'] += 1
        
        # Check if user has exceeded generation limit
        if session['generate_count'] > 3:
            return "Please login in to comtinue", 302
        
        prompt = request.form['prompt']
        if not prompt:
            return "Please enter a prompt", 400

        print(session['generate_count'])
        # Generate image
        image = client.text_to_image(prompt, model="black-forest-labs/FLUX.1-dev")

        # Save image to a BytesIO object
        img_io = io.BytesIO()
        image.save(img_io, 'PNG')
        img_io.seek(0)

        return send_file(img_io, mimetype='image/png', as_attachment=False)
    
    # Show remaining generations in template
    remaining = 3 - session.get('generate_count', 0) if session.get('generate_count', 0) <= 3 else 0
    return render_template('index.html', remaining_generations=remaining)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

        db = get_db()
        c = db.cursor()
        c.execute("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", 
                 (username, email, password))
        db.commit()
        db.close()

        # Reset generation count upon registration
        session['generate_count'] = 0
        session['username'] = username
        return redirect(url_for('login'))
    return render_template('login.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        db = get_db()
        c = db.cursor()
        c.execute("SELECT * FROM users WHERE username=? AND password=?", 
                 (username, password))
        user = c.fetchone()
        db.close()
        if user:
            session['username'] = username
            session['generate_count'] = 0  # Reset generation count for logged in users
            return redirect(url_for('index'))
        else:
            return "Invalid credentials"
    return render_template('login.html')

@app.route('/contact', methods=['POST'])
def contact():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        subject = request.form['subject']
        message = request.form['message']

        if not (name and email and subject and message):
            return "All fields are required", 400

        db = get_db()
        c = db.cursor()
        c.execute("INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)", (name, email, subject, message))
        db.commit()
        db.close()

        return render_template('contact.html', message="Your message has been submitted successfully!")
    return render_template('contact.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/<path:filename>')
def static_files(filename):
    return send_file(f'templates/{filename}')

if __name__ == '__main__':
    app.run(debug=True)
