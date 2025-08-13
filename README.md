# FCS Manual Study Tool

## Overview

The FCS Manual Study Tool is an interactive web-based learning application designed to help Family & Children's Services workers master the content in the Wellpoint FCS Provider Manual. This comprehensive study tool includes questions, scenarios, key terms, and flashcards to reinforce critical knowledge needed for field work.

## Purpose

This tool was created to:
- Provide an engaging way to study FCS policies and procedures
- Test understanding of critical concepts through realistic scenarios
- Reinforce knowledge of key terminology and definitions
- Track learning progress over time
- Prepare workers for real-world situations they'll encounter

## Features

### 1. Questions Mode
- 40 comprehensive questions covering all major topics
- Multiple difficulty levels (Easy, Medium, Hard)
- Filter by category or difficulty
- Immediate feedback with detailed explanations
- Page references to the FCS manual for further study
- Progress tracking with score calculation

### 2. Scenarios Mode
- 20 realistic field scenarios
- Test critical thinking and decision-making skills
- Complex situations requiring policy application
- Related concepts highlighted for each scenario
- Difficulty-based filtering

### 3. Terms Mode
- 45 key terms and definitions
- Organized by category
- Search functionality
- Test-relevant terms highlighted
- Quick reference for important concepts

### 4. Flashcards Mode
- Interactive flip cards for term memorization
- Filter by category or test relevance
- Shuffle function for varied practice
- Keywords included for context

## Topics Covered

### Core Knowledge Areas:
- **Eligibility & Intake**: Income requirements, voluntary services, assessment processes
- **Safety Assessment**: Imminent risk, safety planning, emergency removals
- **Case Management**: Documentation, timelines, case planning, reviews
- **Legal Requirements**: Court processes, mandated reporting, parental rights
- **Placement Decisions**: Kinship care, ICPC, adoption processes
- **Service Delivery**: Prevention, intensive services, wraparound support
- **Special Populations**: Youth aging out, ICWA requirements, medical consent

### Critical Timelines:
- 24-hour initial contact requirement
- 72-hour emergency removal court review
- 30-day comprehensive assessment
- 90-day case review cycle
- 12-month permanency hearing

## How to Use

### Getting Started:
1. Open `index.html` in a web browser
2. Click "View FCS Manual" to access the full PDF reference (hosted at Wellpoint)
3. Select a study mode from the navigation bar
4. Use filters to focus on specific topics or difficulty levels

### Study Recommendations:
1. **New Workers**: Start with Terms mode to build vocabulary, then progress to Questions
2. **Experienced Workers**: Focus on Scenarios to test complex decision-making
3. **Test Preparation**: Use filtered Questions by category and Flashcards for memorization
4. **Refresher Training**: Review all modes focusing on areas of uncertainty

### Progress Tracking:
- The tool automatically saves your progress locally
- Reset progress anytime using the Reset button
- Track scores separately for Questions and Scenarios
- Review incorrect answers to identify knowledge gaps

## Technical Information

### Files Structure:
```
fcs-study-tool/
├── index.html          # Main application file
├── styles.css          # Styling (green/teal theme)
├── script.js           # Application logic
├── questions.json      # 40 questions with answers
├── scenarios.json      # 20 field scenarios
├── terms.json          # 45 key terms
└── README.md          # This documentation
```

*Note: The FCS Provider Manual is hosted externally at Wellpoint and accessed via the "View FCS Manual" button in the application.*

### Browser Compatibility:
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile responsive design

### Data Storage:
- Progress saved in browser's localStorage
- No personal data collected
- Works offline after initial load

## Updating Content

### To Add New Questions:
1. Edit `questions.json`
2. Follow the existing structure:
```json
{
  "id": "q_041",
  "text": "Question text here",
  "options": {
    "A": "Option A",
    "B": "Option B",
    "C": "Option C",
    "D": "Option D"
  },
  "correct": "A",
  "explanation": "Explanation text",
  "studyPages": [page numbers],
  "category": "Category Name",
  "difficulty": "Easy|Medium|Hard"
}
```

### To Add New Scenarios:
1. Edit `scenarios.json`
2. Include realistic field situations
3. Ensure clear correct answers with policy basis
4. Add relevant page references

### To Add New Terms:
1. Edit `terms.json`
2. Mark test-relevant terms appropriately
3. Include keywords for search functionality
4. Assign to appropriate category

## Best Practices

### For Maximum Learning:
- Review explanations even for correct answers
- Use page references to read source material
- Practice scenarios multiple times
- Create discussion groups around complex scenarios
- Regular review sessions (weekly recommended)

### For Trainers:
- Use scenarios for group discussions
- Track common wrong answers for training focus
- Supplement with real-world examples
- Encourage peer learning and discussion

## Support and Feedback

For questions, suggestions, or to report errors:
- Contact your FCS training coordinator
- Submit feedback through your agency's training portal
- Check for updates regularly

## Version History

- **Version 1.0** (Current): Initial release with 40 questions, 20 scenarios, and 45 terms
- All content based on current Wellpoint FCS Provider Manual

## Legal Notice

This study tool is for educational purposes only. Always refer to the official FCS Provider Manual and current policies for authoritative guidance. Case decisions should be made in consultation with supervisors and based on current policy.

---

*Created for Wellpoint Family & Children's Services Training Department*