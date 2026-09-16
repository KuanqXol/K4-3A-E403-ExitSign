export type Difficulty = "Easy" | "Medium" | "Hard";
export type Concept = "Sorted Arrays" | "Binary Search" | "Time Complexity";
export const concepts: Concept[] = [
  "Sorted Arrays",
  "Binary Search",
  "Time Complexity",
];
export const slides: {
  title: string;
  concept: Concept;
  description: string;
  points: string[];
}[] = [
  {
    title: "A better way to find things.",
    concept: "Sorted Arrays",
    description:
      "An algorithm is a clear sequence of steps for solving a problem. Let’s discover a faster way to search.",
    points: [
      "Start with a collection of values",
      "Choose a target to find",
      "Compare linear search with binary search",
    ],
  },
  {
    title: "Order makes a difference.",
    concept: "Sorted Arrays",
    description:
      "A sorted array arranges values from smallest to largest. Their positions tell us where to look next.",
    points: [
      "Values follow a predictable order",
      "Smaller values appear on the left",
      "Larger values appear on the right",
    ],
  },
  {
    title: "Binary Search",
    concept: "Binary Search",
    description:
      "Binary Search repeatedly divides a sorted search space into two halves.",
    points: [
      "Data must be sorted",
      "Compare the target with the middle element",
      "Eliminate half of the search space",
      "Time complexity: O(log n)",
    ],
  },
  {
    title: "Half the work. Every time.",
    concept: "Binary Search",
    description:
      "Looking for 5? The middle value is 12. Since 5 is smaller, we can ignore everything to the right.",
    points: [
      "Compare 5 with the middle value, 12",
      "Keep the left half: 2, 5, 8",
      "The new middle is 5. Target found!",
    ],
  },
  {
    title: "Why O(log n)?",
    concept: "Time Complexity",
    description:
      "Doubling the input adds only one more halving step. That is the power of logarithmic growth.",
    points: [
      "8 values → at most 4 middle comparisons",
      "16 values → at most 5 middle comparisons",
      "Worst-case comparisons: floor(log₂ n) + 1",
    ],
  },
  {
    title: "Small steps. Big searches.",
    concept: "Time Complexity",
    description:
      "A million sorted values can be searched in at most 20 middle comparisons.",
    points: [
      "Each comparison removes roughly half the candidates",
      "Linear search can require n comparisons",
      "Binary search grows logarithmically",
    ],
  },
  {
    title: "Put the pieces together.",
    concept: "Binary Search",
    description:
      "Maintain a search interval, compare its middle with your target, and repeat until you find a match or the interval is empty.",
    points: [
      "Initialize left and right boundaries",
      "Move right leftward, or left rightward",
      "Stop on a match or an empty interval",
    ],
  },
  {
    title: "You have a new search strategy.",
    concept: "Time Complexity",
    description:
      "Ordered data lets you confidently discard half the possibilities at each step.",
    points: [
      "Sort first",
      "Compare with the middle",
      "Narrow the interval",
      "Think in O(log n)",
    ],
  },
];
export type Question = {
  prompt: string;
  options: string[];
  answer: number;
  hint: string;
  explanation: string;
};
export const questions: Record<Concept, Record<Difficulty, Question>> = {
  "Sorted Arrays": {
    Easy: {
      prompt: "Which array is sorted in ascending order?",
      options: ["8, 2, 5", "2, 5, 8", "5, 8, 2", "8, 5, 2"],
      answer: 1,
      hint: "Look for values that increase from left to right.",
      explanation:
        "In ascending order, each value is no smaller than the one before it.",
    },
    Medium: {
      prompt: "What does the order of a sorted array tell us?",
      options: [
        "All values are unique",
        "Values on the left are no greater than the middle",
        "The array uses less memory",
        "The target always exists",
      ],
      answer: 1,
      hint: "Compare the middle element with its neighbors.",
      explanation:
        "Ascending order guarantees that values to the left are no greater than the middle.",
    },
    Hard: {
      prompt: "Can Binary Search work with duplicate values in a sorted array?",
      options: [
        "No, every value must be unique",
        "Yes, it can find a matching occurrence",
        "Only if all values are equal",
        "Only with linear time",
      ],
      answer: 1,
      hint: "Duplicates do not break the ordering of the array.",
      explanation:
        "Binary Search can find a match among duplicates. Finding the first occurrence requires a boundary variation.",
    },
  },
  "Binary Search": {
    Easy: {
      prompt:
        "The target is 5 and the middle value is 12. Where should we search next?",
      options: [
        "The right half",
        "The left half",
        "Both halves",
        "Nowhere — 5 cannot exist",
      ],
      answer: 1,
      hint: "Is the target smaller or larger than the middle value?",
      explanation:
        "5 is smaller than 12. In an ascending sorted array, we keep only the left half.",
    },
    Medium: {
      prompt: "Why does Binary Search require a sorted array?",
      options: [
        "To reduce memory usage",
        "To determine which half can be eliminated",
        "To avoid duplicate values",
        "To make the array smaller",
      ],
      answer: 1,
      hint: "Think about how the algorithm decides whether to search the left or right half.",
      explanation:
        "Binary Search can eliminate half of the remaining values only because the data is already ordered. If the target is less than 12, search only the left half.",
    },
    Hard: {
      prompt:
        "Searching for 23 in [2, 5, 8, 12, 16, 23, 38], which values are compared?",
      options: [
        "12 → 16 → 23",
        "12 → 23",
        "2 → 5 → 8 → 12 → 16 → 23",
        "38 → 23",
      ],
      answer: 1,
      hint: "After comparing with 12, find the middle of the remaining right half.",
      explanation:
        "First compare with 12. The right interval is [16, 23, 38], whose middle is 23.",
    },
  },
  "Time Complexity": {
    Easy: {
      prompt:
        "What happens to the search space after an unsuccessful middle comparison?",
      options: [
        "It doubles",
        "Roughly half is removed",
        "Only one value is removed",
        "It stays unchanged",
      ],
      answer: 1,
      hint: "Binary means two. Think about splitting the remaining range.",
      explanation:
        "The comparison tells us which half cannot contain the target.",
    },
    Medium: {
      prompt:
        "How does Binary Search’s worst-case time grow with input size n?",
      options: ["O(n²)", "O(log n)", "O(n)", "O(1)"],
      answer: 1,
      hint: "Count how many times you can halve n before reaching one.",
      explanation: "Repeated halving leads to logarithmic growth: O(log n).",
    },
    Hard: {
      prompt:
        "For 16 sorted values, what is the maximum number of middle comparisons in standard Binary Search?",
      options: ["4", "5", "8", "16"],
      answer: 1,
      hint: "Include the final comparison when just one candidate remains.",
      explanation:
        "The worst-case bound is floor(log₂ 16) + 1 = 5 middle comparisons.",
    },
  },
};
