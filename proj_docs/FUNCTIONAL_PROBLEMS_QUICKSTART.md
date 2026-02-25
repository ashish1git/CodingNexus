# Quick Start Guide - Creating Functional Problems

## Step-by-Step Visual Guide

### Step 1: Admin Dashboard → Competition Management
```
Click "Create Competition" button
```

### Step 2: Fill Basic Info
```
┌─────────────────────────────────────────────┐
│ Competition Title:     "Weekly Code Sprint" │
│ Description:           "Test your skills"   │
│ Difficulty:            Medium              │
│ Start Time:            [Date/Time picker]  │
│ End Time:              [Date/Time picker]  │
│ Duration:              180 minutes          │
│ Prize:                 ₹5000               │
│ Category:              Algorithm           │
│ Type:                  Rated               │
└─────────────────────────────────────────────┘

Click "Next: Add Problems"
```

### Step 3: Add Problems (Where the magic happens!)

#### Basic Problem Info:
```
┌─────────────────────────────────────────────┐
│ Problem Title:         "Two Sum"            │
│ Points:                100                  │
│                                             │
│ Problem Description:                        │
│ ┌───────────────────────────────────────┐  │
│ │ Given an array of integers nums and   │  │
│ │ an integer target, return the indices │  │
│ │ of the two numbers that add up to     │  │
│ │ the target...                         │  │
│ └───────────────────────────────────────┘  │
│                                             │
│ Difficulty:            Medium              │
│                                             │
└─────────────────────────────────────────────┘
```

#### ⭐ NEW: Function Configuration (LeetCode Style):
```
┌─────────────────────────────────────────────┐
│ 💻 Function Configuration (LeetCode Style) │
├─────────────────────────────────────────────┤
│                                             │
│ Function Name:         twoSum              │
│ Return Type:           int[]               │
│                                             │
│ Function Parameters:                        │
│ ┌─────────────────┬──────────────────┐    │
│ │ nums            │ int[]            │ ✕  │
│ │ target          │ int              │ ✕  │
│ └─────────────────┴──────────────────┘    │
│                                     [+ Add] │
│                                             │
│ Time Limit (ms):       3000                │
│ Memory Limit (MB):     256                 │
│                                             │
└─────────────────────────────────────────────┘
```

#### Starter Code Editor (Multi-Language):
```
┌─────────────────────────────────────────────────┐
│ Starter Code Templates                          │
├──────────┬───────┬──────┬────────┬────┤         │
│ Python   │ C++   │ Java │ JS     │ C  │         │
├──────────┴───────┴──────┴────────┴────┤         │
│                                        │         │
│ def twoSum(nums: list[int],            │         │
│            target: int) -> list[int]:  │         │
│     """Find two numbers that sum"""    │         │
│     pass                               │         │
│                                        │         │
│                                        │         │
│                [Switch languages for   │         │
│                 C++, Java, etc...]     │         │
│                                        │         │
└────────────────────────────────────────┘         │
                                                    
💡 Starter code is shown to students when they
   select a language in the code editor
```

#### Constraints & Examples:
```
┌─────────────────────────────────────────────┐
│ Constraints: [Add]                          │
│ ├─ 1 <= nums.length <= 10^4               │
│ ├─ -10^9 <= nums[i] <= 10^9               │
│ └─ -10^9 <= target <= 10^9                │
│                                             │
│ Examples: [Add]                             │
│ ├─ Input: nums = [2,7,11,15], target = 9  │
│ │  Output: [0,1]                          │
│ │  Explanation: ...                       │
│ └─ Input: nums = [3,2,4], target = 6      │
│    Output: [1,2]                          │
└─────────────────────────────────────────────┘
```

#### Test Cases:
```
┌──────────────────────────────────────┐
│ Test Cases: [Add]                    │
├──────────────────────────────────────┤
│ Test Case 1  [Visible]               │
│ Input:    [2,7,11,15], target=9      │
│ Output:   [0,1]                      │
├──────────────────────────────────────┤
│ Test Case 2  [Hidden] ☑️             │
│ Input:    [3,2,4], target=6          │
│ Output:   [1,2]                      │
├──────────────────────────────────────┤
│ Test Case 3  [Hidden] ☑️             │
│ Input:    [3,2,4], target=8          │
│ Output:   []                         │
└──────────────────────────────────────┘

[✓ Add This Problem]
```

### Step 4: Add More Problems (or Click "Create Competition")
```
Problems Added (3):
┌──────────────────────────────────────────┐
│ 1. Two Sum                               │
│    Medium • 100 points • 3 test cases    │
├──────────────────────────────────────────┤
│ 2. Palindrome Check                      │
│    Easy • 50 points • 4 test cases       │
├──────────────────────────────────────────┤
│ 3. Longest Substring                     │
│    Hard • 200 points • 5 test cases      │
└──────────────────────────────────────────┘

[Back]  [✓ Create Competition (3 problems)]
```

---

## What Students See

### When Entering Competition:
```
SELECT LANGUAGE:  [Python ▼]

░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Starter Code Auto-Loads:
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

def twoSum(nums: list[int], 
           target: int) -> list[int]:
    """
    Find two numbers that add up to target.
    
    Args:
        nums: List of integers
        target: Target sum
        
    Returns:
        List containing indices of the two numbers
    """
    pass
```

### Student Implements:
```
def twoSum(nums: list[int], 
           target: int) -> list[int]:
    """Find two numbers that add up to target."""
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
    return []
```

### Test Results:
```
✅ Test Case 1: PASSED
   Input: [2,7,11,15], target=9
   Output: [0,1]
   Expected: [0,1]
   
✅ Test Case 2: PASSED
   Input: [3,2,4], target=6
   Output: [1,2]
   Expected: [1,2]
   
[Run Code]  [Save & Run]  [Submit All]
```

---

## Key Features Explained

### Function Name
- Defines the exact function students must implement
- Used in code wrapping for Judge0 execution
- Example: `twoSum`, `isValid`, `findMedian`

### Parameters
- Define function signature
- Student code must match these parameters
- Improves type safety and clarity
- Format: `name: type`
  - `nums: int[]`
  - `s: string`
  - `root: TreeNode`

### Return Type
- Specifies what the function returns
- Type checking in Judge0
- Examples: `int`, `string`, `bool`, `vector<int>`, `ListNode`

### Starter Code by Language
- Template shown to each student based on their language choice
- Reduces boilerplate, focuses on algorithm
- Can include helpful docstrings and hints
- 5 languages supported: Python, C++, Java, JavaScript, C

### Time/Memory Limits
- Per-problem execution constraints
- Prevents infinite loops and memory abuse
- Defaults: 3000ms, 256MB
- Can be customized per problem difficulty

---

## Common Problems Setup Examples

### Example 1: String Reversal
```
Function Name:    reverseString
Return Type:      string
Parameters:       s: string
Time Limit:       1000ms
Memory Limit:     128MB

Python Starter:
def reverseString(s: string) -> string:
    # Your code here
    pass
```

### Example 2: Tree Traversal
```
Function Name:    inorderTraversal
Return Type:      list[int]
Parameters:       root: TreeNode
Time Limit:       5000ms
Memory Limit:     512MB

Python Starter:
def inorderTraversal(root: TreeNode) -> list[int]:
    # Complete the tree traversal
    pass
```

### Example 3: Dynamic Programming
```
Function Name:    fib
Return Type:      int
Parameters:       n: int
Time Limit:       2000ms
Memory Limit:     256MB

Python Starter:
def fib(n: int) -> int:
    # Generate fibonacci number
    pass
```

---

## Troubleshooting Tips

### ✅ DO:
- Use clear function names matching problem domain
- Include all necessary parameters
- Set reasonable time/memory limits
- Test starter code before saving
- Use hidden test cases for tricky edge cases
- Match parameter types across languages

### ❌ DON'T:
- Make function name too generic
- Forget parameters that students need
- Set unreasonable time limits
- Use stdin/stdout in problems
- Expose complete solutions in starter code
- Save without testing

---

## After Problems are Created

1. **Students can browse** competitions with problem previews
2. **Students register** for competitions
3. **During competition**, they see:
   - Problem statement
   - Constraints & examples
   - Code editor with **starter code pre-filled**
   - Test case tester (visible cases only)
4. **On submission**, backend:
   - Wraps function code properly
   - Runs against ALL test cases (visible + hidden)
   - Calculates score based on passing tests
   - Updates leaderboard

---

**Your CodingNexus system is now LeetCode-compatible! 🎉**
