// scripts/create-function-problem.js
// Creates a sample problem with function-only submission format

import prisma from '../server/config/db.js';

async function createFunctionProblem() {
  try {
    // Find or create a competition
    let competition = await prisma.competition.findFirst({
      where: { isActive: true }
    });

    if (!competition) {
      console.log('No active competition found. Creating a test competition...');
      competition = await prisma.competition.create({
        data: {
          title: 'Function-Only Test Competition',
          description: 'Test competition for function-only submissions',
          category: 'Algorithm',
          difficulty: 'medium',
          startTime: new Date(),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          duration: 120, // 2 hours
          type: 'individual',
          prizePool: '0',
          maxParticipants: 100,
          isActive: true
        }
      });
      console.log(`✅ Created competition: ${competition.id}`);
    }

    // Create a Two Sum problem
    const problem = await prisma.problem.create({
      data: {
        competitionId: competition.id,
        title: 'Two Sum',
        description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
        difficulty: 'easy',
        points: 100,
        orderIndex: 1,
        
        constraints: [
          '2 <= nums.length <= 10^4',
          '-10^9 <= nums[i] <= 10^9',
          '-10^9 <= target <= 10^9',
          'Only one valid answer exists'
        ],
        
        examples: [
          {
            input: 'nums = [2,7,11,15], target = 9',
            output: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
          },
          {
            input: 'nums = [3,2,4], target = 6',
            output: '[1,2]',
            explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
          },
          {
            input: 'nums = [3,3], target = 6',
            output: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].'
          }
        ],
        
        testCases: [
          {
            input: [[2, 7, 11, 15], 9],
            output: '[0,1]',
            hidden: false,
            points: 20
          },
          {
            input: [[3, 2, 4], 6],
            output: '[1,2]',
            hidden: false,
            points: 20
          },
          {
            input: [[3, 3], 6],
            output: '[0,1]',
            hidden: false,
            points: 20
          },
          {
            input: [[-1, -2, -3, -4, -5], -8],
            output: '[2,4]',
            hidden: true,
            points: 20
          },
          {
            input: [[1000000000, 2000000000, -1000000000], 0],
            output: '[0,2]',
            hidden: true,
            points: 20
          }
        ],
        
        timeLimit: 2,
        memoryLimit: 256,
        
        // Function signature fields
        functionName: 'twoSum',
        returnType: 'int[]',
        parameters: [
          { name: 'nums', type: 'int[]' },
          { name: 'target', type: 'int' }
        ],
        
        starterCode: {
          python: `def twoSum(nums, target):
    """
    :type nums: List[int]
    :type target: int
    :rtype: List[int]
    """
    # Write your code here
    pass`,
          
          cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your code here
        
    }
};`,
          
          java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        
    }
}`,
          
          c: `/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Write your code here
    
}`,
          
          javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Write your code here
    
};`
        }
      }
    });

    console.log(`✅ Created problem: ${problem.id}`);
    console.log(`   Title: ${problem.title}`);
    console.log(`   Function: ${problem.functionName}`);
    console.log(`   Parameters: ${JSON.stringify(problem.parameters)}`);
    console.log(`   Test cases: ${problem.testCases.length}`);
    console.log('\n🎉 Function-only problem created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating problem:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFunctionProblem();
