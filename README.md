# Cosmere RPG Character Builder

A modern, interactive web-based character builder for the **Cosmere Roleplaying Game**. This tool allows players to easily create, manage, and export characters for their adventures in the Cosmere.

## ✨ Features

*   **Interactive Character Sheet**: Real-time updates for attributes, defenses, and resources (Health, Focus, Investiture).
*   **Path Support**: Full support for both **Heroic Paths** (Agent, Leader, Hunter, etc.) and **Radiant Paths** (Windrunner, Skybreaker, etc.).
*   **Automatic Calculations**:
    *   Derived stats (Defenses, Max Health/Focus) calculated automatically based on attributes and level.
    *   **Surge Calculations**: Automatically determines Surge ranks and die sizes based on skills and attributes.
*   **Talent Management**:
    *   Split data architecture for clean management of Heroic and Radiant talents.
    *   Automatic Key Talent selection.
    *   Prerequisite tracking and descriptions.
*   **Equipment & Inventory**: Manage weapons, armor, and general equipment.
*   **Save & Load**:
    *   Save your character to a compact JSON file.
    *   Load functionality to resume editing anytime.
*   **PDF Export**:
    *   Generates a print-ready character sheet using a custom PDF template.
    *   Supports custom fonts for Cosmere symbols (e.g., activation icons).
    *   Includes a dedicated spell/surge sheet for Radiants.

## 🛠️ Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/) (React)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **PDF Generation**: [pdf-lib](https://pdf-lib.js.org/) & [fontkit](https://github.com/foliojs/fontkit)

## 🚀 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd web-app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  **Open in Browser**:
    Navigate to [http://localhost:3000](http://localhost:3000) to see the builder in action.

## 📂 Project Structure

*   `src/components`: React components (Forms, UI elements, Layout).
*   `src/context`: React Context for global character state management.
*   `src/data`: JSON data files for game rules (Ancestries, Paths, Talents, Items).
    *   `heroic_talents.json` & `radiant_talents.json`: Split talent databases.
*   `src/utils`: Helper functions, including the PDF export logic (`pdfExport.ts`) and serialization.
*   `public/`: Static assets (Fonts, PDF Templates).

## 📝 License & Disclaimer

**Software License**: The source code of this application is licensed under the [MIT License](LICENSE).

**Fan Content Policy Disclaimer**:
> This is unofficial fan content, created and shared for non-commercial use. It has not been reviewed by Dragonsteel Entertainment, LLC or Brotherwise Games, LLC.

This project is a fan-made tool designed for use with the **Cosmere Roleplaying Game**. It is not affiliated with, endorsed by, or sponsored by Brotherwise Games or Dragonsteel Entertainment. The Cosmere concepts, terms, and setting are copyright of their respective owners.

