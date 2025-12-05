# AI-Powered RFP Management System

A single-user web application to streamline the Request for Proposal (RFP) process using AI.

## Features

- **Natural Language RFP Creation**: Describe your needs in plain English (e.g., "I need 50 laptops..."), and the system uses AI to generate a structured RFP.
- **Vendor Management**: Add and manage vendor details.
- **Email Integration**:
  - Send RFPs to selected vendors via email.
  - Automatically poll for and fetch vendor email responses.
- **AI Response Parsing**: Automatically extracts structured data (pricing, delivery, terms) from unstructured vendor emails.
- **AI Comparison**: Generates a side-by-side comparison matrix and provides a recommendation on the best vendor.

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express, MongoDB
- **AI**: Google Gemini API (`gemini-1.5-flash`)
- **Email**: Nodemailer (SMTP), imap-simple (IMAP)

## Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas)
- Google Gemini API Key
- Gmail Account with App Password (for sending/receiving)

## Setup Instructions

1.  **Clone the Repository**

    ```bash
    git clone <repo-url>
    cd RFP
    ```

2.  **Backend Setup**

    ```bash
    cd backend
    npm install
    ```

    Create a `.env` file in `backend/`:

    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/rfp-system
    GEMINI_API_KEY=your_gemini_api_key
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_app_password
    ```

    Start the server:

    ```bash
    npm start
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

## API Documentation

### RFPs

- `POST /api/rfps/generate`: Generate structured RFP from text.
- `POST /api/rfps`: Save a new RFP.
- `GET /api/rfps`: List all RFPs.
- `GET /api/rfps/:id`: Get details of an RFP.
- `POST /api/rfps/:id/send`: Send RFP to vendors.
- `POST /api/rfps/check-responses`: Trigger email polling.
- `GET /api/rfps/:id/proposals`: Get proposals for an RFP.
- `POST /api/rfps/:id/compare`: Generate AI comparison.

### Vendors

- `GET /api/vendors`: List vendors.
- `POST /api/vendors`: Add a vendor.
- `DELETE /api/vendors/:id`: Delete a vendor.

## Design Decisions

- **Monorepo**: Kept frontend and backend in a single repo for simplicity.
- **AI Model**: Used Gemini 1.5 Flash for speed and cost-efficiency.
- **Email Polling**: Implemented on-demand polling via a button to avoid background complexity for this assignment.
- **No Auth**: As per requirements, user authentication was out of scope.

## Limitations

- **Single User**: Designed for a single procurement manager.
- **Email Parsing**: Assumes vendor replies to the specific thread or subject line for matching (basic subject matching implemented).
- **Error Handling**: Basic error alerts; could be improved with toast notifications.
