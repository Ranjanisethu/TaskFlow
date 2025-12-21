# How to Share Your Local App with the World (Using Ngrok)

This method creates a secure tunnel from your laptop to the internet. 
**Pros:** Free, No Credit Card, Instant.
**Cons:** The link stops working if you close your laptop or the terminal.

### Step 1: Install Ngrok
1.  Go to [ngrok.com/download](https://ngrok.com/download).
2.  Download the **Windows** version (zip file).
3.  Unzip it (you will see `ngrok.exe`).
4.  (Optional but recommended) Sign up for a free account to get a permanent token (removes time limits).

### Step 2: Start Your App
1.  Open VS Code.
2.  Open a Terminal (`Ctrl + ~`).
3.  Run your app:
    ```powershell
    mvn spring-boot:run
    ```
4.  Wait until you see "Started TaskManagementApplication" and confirm it works at `http://localhost:8080`.

### Step 3: Go Live!
1.  Double-click `ngrok.exe` (or open it in a terminal).
2.  Type this command and hit Enter:
    ```cmd
    ngrok http 8080
    ```
3.  You will see a screen like this:
    ```
    Forwarding                    https://a1b2-c3d4.ngrok-free.app -> http://localhost:8080
    ```
4.  **Copy the `https://...` link.**
5.  Send that link to your friends! 🚀

### Important Notes
*   **Keep the Terminal Open:** Do NOT close the ngrok window or the VS Code terminal. If you close them, the site goes offline.
*   **Data:** Since we are running locally, the app uses your **Local MongoDB**. Any data they enter is saved on **your** laptop.
