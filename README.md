# Stock Prediction Website - Stocktastic

Welcome to the Stock Prediction Website project! This application is created as part of a project for the Programming Fundamentals module.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [UX](#ux)
3. [Features](#features)
4. [Technologies Used](#technologies-used)
5. [Deployment](#deployment)
6. [Credits](#credits)

---

## Project Overview

This project offers an AI-powered platform for stock market analysis and education. It provides real-time stock predictions, historical data visualization, relevant news summaries, and investment simulations. By making financial insights accessible, this platform empowers users, especially beginners, to make informed investment decisions.

## UX

- As a beginner, I want to look up stock performance, so that I can understand its history and make informed decisions.
- As a user, I want to receive AI predictions, so that I have guidance on the best price points to buy stocks.
- As an investor, I want to read related stock news, so that I can stay updated on market conditions and company performance.
- As a curious learner, I want to use a simulation tool, so that I can experiment with potential earnings without any risk.

Ideation: https://www.figma.com/board/II04DNcDu6DJaxuye3PJFv/DFSD-Assignment-Ideation?t=LLwx7HGJ2ZcJq6zm-1

Inital mock up: https://www.figma.com/design/Nv3UWnLEIOkSjdfGYzxNxY/DFSD-Stock-App?node-id=0-1&t=LLwx7HGJ2ZcJq6zm-1

## Features

**Current features:**

- **AI-Driven Stock Predictions**: Forecasts based on historical data and AI algorithms.
- **Historical Data & Chart Visualization**: Interactive charts displaying past stock performance.
- **Stock-Related News**: Provide latest stock related news articles.
- **Investment Simulations**: Simulate potential earnings based on user input data.

**Other features to be implemented:**

- Leverage LLM API to summarize stock-related news.
- Classify stocks by industry so users can view not only the specific stock ticker they search but also other closely related stocks.

## Technologies Used

- HTML: Used for structuring the content and layout of the website.
- CSS: Used for styling the website and enhancing its visual appeal.
- JavaScript: Used for DOM manipulation and dynamic features to the website.
- Bootstrap: A CSS framework that streamlined the design process with pre-designed components and responsive layouts.
- Bootstrap Icons: Integrated for adding visually appealing icons to the website.
- Google Fonts: Used to enhance the typography of the website with modern and clean fonts.
- Animate.css: A library used to add animations to elements, improving user experience and interactivity.
- Chart.js: Utilized to create visually engaging and interactive charts for data visualization.
- Flatpickr: Used for the date input feature, providing a sleek and user-friendly date picker interface.

## Deployment

This project is deployed using GitHub Pages, with a structured approach to managing the development and deployment workflows.

**Branch Structure:**

- The dev branch contains all new features under development and testing.
- The main branch is the stable version used for deployment.
- This branch structure ensures a clear separation between testing and production-ready code.

**Environment Variables:**

- To enhance security while working on the front-end, I used RESTDB to store my RapidAPI key. This method helps maintain a certain level of security since there is no inherently secure way to store API keys on the client side.

**Differences Between Local and Deployed Versions:**

- The local development environment uses the dev branch for testing new features and debugging.
- The deployed version on GitHub Pages directly reflects the main branch, ensuring stability and consistency for users.

## Credits

**Content:**

- The inspiration for the website's design and layout was drawn from the Apple and Endowus websites.

**Media:**

- The website's image icon was generated using ChatGPT.

Link to website: https://c-minda.github.io/PGFM-Stocktastic/
