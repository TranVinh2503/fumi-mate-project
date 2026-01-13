# TODO: Update generate_task function for Japanese writing tasks

## Information Gathered
- Current `generate_task` function generates multiple choice/fill-in-the-blank questions
- `debai&tieuchi.md` contains 9 Japanese writing prompts and detailed rubric
- Writing tasks include: 手紙 (letters), スピーチ (speeches), 意見・感想 (opinions/impressions)
- Rubric has 4 criteria: Task Achievement, Content & Organization, Vocabulary & Expression, Grammar & Accuracy

## Plan
1. ✅ Update `generate_task` function to generate writing tasks instead of MCQs
2. ✅ Create predefined writing prompts from the markdown content
3. ✅ Include rubric information for each task
4. ✅ Add level-appropriate modifications for different proficiency levels
5. ✅ Update the response structure to include writing prompts and assessment criteria

## Dependent Files to be edited
- ✅ `fumi-mate-api/services/gemini_service.py` - Updated generate_task and generate_mock_task functions

## Followup steps
- ✅ Test the updated function with different topics and levels
- ✅ Verify the response structure matches frontend expectations
- ✅ Ensure compatibility with existing API calls

## Implementation Summary
Successfully updated both `generate_task()` and `generate_mock_task()` functions with:
- 9 Japanese writing prompts from debai&tieuchi.md
- Complete 4-criteria rubric (Task Achievement, Content & Organization, Vocabulary & Expression, Grammar & Accuracy)
- Topic-based filtering (letter, speech, opinion, narrative, comparison)
- Response structure change from "questions" to "prompts"
- Maintained API compatibility with existing frontend calls
