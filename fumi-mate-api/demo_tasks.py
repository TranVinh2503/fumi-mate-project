#!/usr/bin/env python3
"""
Demo script showing the updated generate_task function for Japanese writing tasks
"""
import sys
import json
sys.path.append('.')
from services.gemini_service import generate_mock_task

def demo_task(topic, level, num_questions):
    """Generate and display a Japanese writing task"""
    print(f"\n{'='*60}")
    print(f"📝 Japanese Writing Task Demo")
    print(f"{'='*60}")
    print(f"Topic: {topic}")
    print(f"Level: {level}")
    print(f"Number of prompts: {num_questions}")
    
    # Generate the task
    result = generate_mock_task(topic, level, num_questions)
    
    # Display task details
    print(f"\n🎯 Task Information:")
    print(f"   Title: {result['title']}")
    print(f"   Level: {result['level']}")
    print(f"   Description: {result['description']}")
    
    # Display prompts
    print(f"\n📋 Writing Prompts ({len(result['prompts'])}):")
    for i, prompt in enumerate(result['prompts'], 1):
        print(f"\n   Prompt {i}:")
        print(f"   Type: {prompt['type']}")
        print(f"   Prompt: {prompt['prompt']}")
        print(f"   Word Count: {prompt['wordCount']} characters")
        print(f"   Key Vocabulary: {', '.join(prompt['vocabulary'])}")
        print(f"   Grammar Patterns: {', '.join(prompt['grammar'])}")
    
    # Display rubric
    print(f"\n📊 Assessment Rubric:")
    rubric = result['rubric']
    total_points = sum(criterion['maxPoints'] for criterion in rubric['criteria'])
    print(f"   Total Points: {total_points}")
    
    for criterion in rubric['criteria']:
        print(f"\n   {criterion['name']} ({criterion['japanese']})")
        print(f"   Max Points: {criterion['maxPoints']}")
        print(f"   Focus: {criterion['description']}")
        
        # Show level descriptions
        levels = criterion['levels']
        print(f"   Performance Levels:")
        print(f"     • Excellent: {levels['excellent']}")
        print(f"     • Good: {levels['good']}")
        print(f"     • Satisfactory: {levels['satisfactory']}")
        print(f"     • Needs Improvement: {levels['needsImprovement']}")

if __name__ == "__main__":
    print("🎌 Japanese Writing Task Generator - Updated for debai&tieuchi.md")
    print("This demo shows the updated generate_task function that generates")
    print("Japanese writing tasks based on the content from debai&tieuchi.md")
    
    # Demo different types of writing tasks
    demo_tasks = [
        ("letter", "intermediate", 2),
        ("opinion", "beginner", 1),
        ("speech", "intermediate", 1),
        ("narrative", "advanced", 1),
        ("comparison", "beginner", 1)
    ]
    
    for topic, level, num_questions in demo_tasks:
        demo_task(topic, level, num_questions)
    
    print(f"\n{'='*60}")
    print("✅ Demo completed! The generate_task function now:")
    print("   • Generates authentic Japanese writing prompts")
    print("   • Includes comprehensive 4-criteria rubric")
    print("   • Supports topic-based filtering")
    print("   • Provides vocabulary and grammar guidance")
    print("   • Maintains API compatibility")
    print(f"{'='*60}")
