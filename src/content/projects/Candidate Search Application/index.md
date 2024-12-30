---
title: "Building Lessume: A Candidate Search Applicatoin"
summary: "Lessume is a web application that streamlines resume management and candidate search. It uses AI to extract key insights from resumes, stores data securely in MongoDB, and enables recruiters to perform semantic searches powered by OpenAI models."
date: "Oct 13 2024"
draft: false
tags:
  - Resume Parsing
  - OpenAI API
  - MongoDB
  - Streamlit
  - Semantic Search
  - Python
  - Data Extraction
  - Resume Management
repoUrl: https://github.com/srikeerthis/resume_connect
---

## Project Overview

Lessume is a project built during HackUTA 2024 to tackle a common problem: simplifying the process of finding the right candidates for a job. It combines AI-driven text analysis with a user-friendly interface to make resume management seamless for both candidates and recruiters.

## How it works:

### Candidate View

- Upload your resume in PDF format.
- Fill out a structured form with personal and job-specific information.
- Submit the resume for analysis and storage.

### Recruiter View

- Search for the perfect candidate using natural language queries.
- Get results that match skills, qualifications, and other criteria.

## Key Features

- **AI-Powered Analysis**: Extracts skills, experience, and insights using OpenAI GPT models.
- **Semantic Search**: Helps recruiters find candidates with precision using natural language.
- **Easy Integration**: Stores resumes and data in a cloud-based MongoDB database.

## Technologies Used

- **Frontend**: [Streamlit](https://streamlit.io/)
- **Backend**:
  - [MongoDB](https://www.mongodb.com/) for database storage.
  - [OpenAI GPT-4](https://openai.com/) for resume analysis and embeddings.
- **Python Libraries**:
  - `pymongo` for MongoDB integration.
  - `PyPDF2` for PDF text extraction.
  - `scikit-learn` for cosine similarity calculations.

## Lessons Learned

1. **AI Integration**:

   - Implemented OpenAI GPT models for extracting insights from text data.
   - Learned how embeddings can power semantic search to match resumes with job descriptions effectively.

2. **Database Management**:

   - Designed and implemented a MongoDB schema to store resumes, form data, and embeddings.
   - Gained experience with MongoDB Atlas for secure cloud-based database management.

3. **Streamlit Development**:

   - Built an interactive user interface for both candidates and recruiters.
   - Streamlined user workflows for uploading resumes, submitting forms, and searching for candidates.

4. **Collaboration and Project Management**:

   - Worked on managing a project timeline effectively.
   - Communicated technical challenges and solutions within a team setting.

5. **Full-Stack Application Development**:
   - Combined frontend, backend, and AI models into a cohesive application.
   - Handled API integration, environment configuration, and dependency management effectively.

## Challenges

- Diverse Resume Formats: Tackled inconsistency using PDF text extraction and AI analysis.
- Scalable Search: Used embeddings and cosine similarity for accurate and efficient results.

## Future Enhancements

- Advanced Filters: Add options like location or experience level.
- Interactive Dashboards: Give recruiters better insights through data visualizations.
- Resume Feedback: Help candidates improve their resumes with AI-driven suggestions.

## Repository

Lessume isn’t just a project—it’s a step towards smarter, AI-powered recruitment. It’s a testament to what can be accomplished in a weekend with teamwork, innovation, and the right tools

Find the complete source code and additional documentation on [GitHub](https://github.com/srikeerthis/resume_connect).
