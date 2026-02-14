/**
 * FRONTEND DATA STRUCTURE FOR CREATING CODING COMPETITIONS
 * This is the format your admin panel should use when creating competitions
 */

const competitionCreationPayload = {
  // Basic Competition Info
  title: "Testing competition #1",
  description: "A beginner-friendly coding competition",
  category: "programming",
  difficulty: "easy",
  type: "individual", // or "team"
  
  // Timing
  startTime: "2026-02-14T13:30:00Z",
  endTime: "2026-02-14T15:30:00Z",
  duration: 120, // minutes
  
  // Logistics
  prizePool: 5000, // rupees or currency
  maxParticipants: 100,
  isActive: true,
  
  // Problems Array - Each problem in the competition
  problems: [
    {
      title: "Sum of Two Numbers",
      description: `Given two integers a and b, calculate and print their sum.

Constraints:
- -10^9 <= a, b <= 10^9

Examples:
- Input: a = 5, b = 3
- Output: 8`,
      
      difficulty: "easy",
      points: 100, // points for solving this problem
      orderIndex: 0, // order in competition
      
      // Constraints list
      constraints: [
        "-10^9 <= a, b <= 10^9"
      ],
      
      // Example test cases (visible to students)
      examples: [
        {
          input: "5 3",
          output: "8",
          explanation: "5 + 3 = 8"
        },
        {
          input: "-10 7",
          output: "-3",
          explanation: "-10 + 7 = -3"
        },
        {
          input: "0 0",
          output: "0",
          explanation: "0 + 0 = 0"
        }
      ],
      
      // Test Cases - the actual judge cases
      testCases: [
        // Visible test cases (students see these)
        {
          input: "5 3",
          output: "8",
          hidden: false
        },
        {
          input: "-10 7",
          output: "-3",
          hidden: false
        },
        {
          input: "0 0",
          output: "0",
          hidden: false
        },
        // Hidden test cases (only for final verdict)
        {
          input: "1000000 2000000",
          output: "3000000",
          hidden: true
        },
        {
          input: "-500 -500",
          output: "-1000",
          hidden: true
        }
      ],
      
      // Time and Memory Limits
      timeLimit: 2, // seconds
      memoryLimit: 256000, // KB (256 MB)
      
      // For function-only submissions (optional)
      functionName: null, // Leave null for complete programs
      parameters: null,   // Leave null for complete programs
      returnType: null,   // Leave null for complete programs
      
      // Starter code (optional - shown to students)
      starterCode: {
        java: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;

public class Main {
    public static void main(String[] args) throws IOException {
        // Write your code here
    }
}`,
        python: `# Write your code here
a, b = map(int, input().split())
print(a + b)`,
        cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}`,
        c: `#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}`,
        javascript: `// Write your code here
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  // Process input
});`
      }
    }
    // Add more problems here for multi-problem competitions
  ]
};

/**
 * SIMPLIFIED VERSION - What users submit
 * When creating competition from admin panel
 */
const adminFormPayload = {
  title: "Testing competition #1",
  description: "A beginner-friendly coding competition",
  category: "programming", 
  difficulty: "easy",
  startTime: new Date("2026-02-14T13:30:00Z"),
  endTime: new Date("2026-02-14T15:30:00Z"),
  duration: 120,
  prizePool: 5000,
  maxParticipants: 100,
  
  // Problems data
  problems: [
    {
      title: "Sum of Two Numbers",
      description: "Given two integers a and b, calculate their sum.",
      difficulty: "easy",
      points: 100,
      constraints: ["-10^9 <= a, b <= 10^9"],
      examples: [
        { input: "5 3", output: "8", explanation: "5 + 3 = 8" },
        { input: "-10 7", output: "-3", explanation: "-10 + 7 = -3" }
      ],
      testCases: [
        { input: "5 3", output: "8", hidden: false },
        { input: "-10 7", output: "-3", hidden: false },
        { input: "0 0", output: "0", hidden: false },
        { input: "1000000 2000000", output: "3000000", hidden: true },
        { input: "-500 -500", output: "-1000", hidden: true }
      ],
      timeLimit: 2,
      memoryLimit: 256000
    }
  ]
};

/**
 * KEY POINTS FOR FRONTEND:
 * 
 * 1. Test Case Input Format:
 *    - Use SPACE-SEPARATED for stdin input
 *    - Example: "5 3" (NOT "5, 3")
 *    - Each line is one input line
 *    - Separate multiple inputs with \n
 * 
 * 2. Test Case Output Format:
 *    - Just the output value
 *    - Example: "8" (NOT "8\n" or extra spaces)
 *    - Trailing newline is trimmed automatically
 * 
 * 3. Hidden Test Cases:
 *    - Set hidden: true for final verdict tests
 *    - Only counts for scoring, students don't see input/output
 *    - Solution is judged against these too
 * 
 * 4. Visible Test Cases:
 *    - Set hidden: false
 *    - Students can see input/output in "Run" preview
 *    - Helps them debug their code
 * 
 * 5. Examples vs Test Cases:
 *    - examples: Shown in problem description
 *    - testCases: Used for actual testing/scoring
 * 
 * 6. Starter Code:
 *    - Optional but recommended
 *    - Shown to students for that language
 *    - Helps them get started quickly
 * 
 * 7. Time/Memory Limits:
 *    - timeLimit: in seconds (default 2s)
 *    - memoryLimit: in KB (default 256MB = 256000 KB)
 */

export { competitionCreationPayload, adminFormPayload };
