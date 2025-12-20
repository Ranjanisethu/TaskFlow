# How to Deploy / Run TaskFlow

You have two main options for your submission tomorrow:

## Option 1: Run Locally (Recommended for Presentation)
This is the safest and fastest way to show your project on your own laptop.

### Prerequisites
1.  **Java 17+**: Ensure you have Java installed (`java -version`).
2.  **MongoDB**: Ensure MongoDB Compass/Service is running locally on port `27017`.

### Steps
1.  **Open Terminal** in the project folder: `E:\taskmanagement`
2.  **Clean and Build** the project:
    ```powershell
    mvn clean package
    ```
    *(Wait for "BUILD SUCCESS")*
3.  **Run the App**:
    ```powershell
    java -jar target/dashboard-0.0.1-SNAPSHOT.jar
    ```
4.  **Access**: Open your browser to `http://localhost:8080`

---

## Option 2: Deploy to Cloud (Advanced)
If you need a public URL (e.g., `https://my-app.railway.app`) to submit to your professor.

### Platforms (Free Tiers)
*   **Railway.app** (Easiest)
*   **Render.com**

### Steps (General)
1.  **Push to GitHub**:
    *   Initialize git: `git init`
    *   Add files: `git add .`
    *   Commit: `git commit -m "Initial commit"`
    *   Create a repo on GitHub and push.
2.  **Connect to Railway/Render**:
    *   Login to Railway/Render with GitHub.
    *   Select your "TaskFlow" repository.
    *   It will automatically detect Maven/Java.
3.  **Environment Variables**:
    *   You MUST provide a MongoDB URL (Cloud DB) in the deployment settings.
    *   `SPRING_DATA_MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0...` (You can get a free DB from MongoDB Atlas).

---

## Troubleshooting
*   **Port 8080 already in use?**
    *   Open `src/main/resources/application.properties` and change `server.port=8080` to `server.port=9090`.
*   **Email Sending Failed?**
    *   Ensure the Google App Password in `application.properties` is correct.
