## TODO

[ ] Admin command to terminate subscriptions  
[ ] Buttons for accepting/approving subscriptions  
[ x ] Buttons for the selection of packages  
[ x ] Automatically send an unavailable movie to the requests channel  
[ x ] On subscription end, delete user data from the subscriptions db  
[ x ] Bulk upload of movies  
[ x ] /latest command for latest movies - posted current date  
[ x ] Ensure that the popularity property of a movie increases after its delivered
[ x ] Prevent upload of already available content  
[ ] Show limited movies and add next button - /search command  
[ ] Accept/Deny Requests
[ x ] Create the /stats command
[ ] Store the movie requests in the db

[//]: # "# 🎬 MovieBot – Your Smart Movie Assistant"
[//]: # "MovieBot helps users discover, request, and manage movies through a clean chat interface (like Telegram or web). It's built for simplicity, smart search, and scalable user interaction."

---

## 🔍 Commands & Features

### `/search <title>`

Search for movies by title.  
**Example:**  
`/search inception` → returns matching movies with **title**, **year**, and **genre**.

---

### 🆕 `/latest`

View the most recently uploaded movies.

- Supports **pagination** via inline buttons: `Next`, `Previous`.

---

### 🗂 `/genres`

Displays all available genres as buttons (e.g., `Action`, `Sci-Fi`, `Drama`).

- Clicking a genre shows matching movie results.

---

### 🔖 `/random`

Returns a **random movie** from the database — perfect when you can't decide what to watch.

---

### 📁 `/requests`

Browse recent movie requests made by users.

- Great for tracking what's in demand.
- Could allow submitting new requests.

---

### ⚙️ `/settings`

User preferences panel:

- Toggle new upload notifications
- Change language (if multilingual is supported)
- View account/subscription status

---

### 📆 `/history`

Returns a list of movies the user has downloaded or interacted with (if history is tracked).

---

### ❓ `/help`

Opens a helpful FAQ menu with common questions:

- How to request a movie?
- How to subscribe?
- Payment not working?
- What is included in each package?

---

### 🧾 `/status`

Shows current subscription/account info:

- Subscription status
- Active package & expiration
- Pending status (if not yet approved)

---

### 💰 `/pay`

Starts the subscription or payment process.

- Can be linked to `/subscribe`
- Optimized for M-Pesa or mobile payment users

---

### 📬 `/contact`

Returns support contact info:

- Email
- WhatsApp/Telegram Support
- Custom message

---

## 👑 Admin-Only Commands

Only accessible by bot admins or studio staff:

- `/approve <code>` – Approves a pending subscription
- `/reject <code>` – Rejects and optionally notifies the user
- `/broadcast <message>` – Sends a message to all subscribers
- `/upload <movie>` – Triggers movie upload/processing
- `/stats` – Displays total movies, users, and subscriptions

---
