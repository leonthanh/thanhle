import React, { useState } from 'react';
import QuillEditor from './QuillEditor';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import MultiSelectQuestion from './MultiSelectQuestion';
import FillBlankQuestion from './FillBlankQuestion';
import ComboboxQuestion from './ComboboxQuestion';
import TrueFalseNotGivenQuestion from './TrueFalseNotGivenQuestion';
import YesNoNotGivenQuestion from './YesNoNotGivenQuestion';
import ParagraphMatchingQuestion from './ParagraphMatchingQuestion';
import SentenceCompletionQuestion from './SentenceCompletionQuestion';
import ShortAnswerQuestion from './ShortAnswerQuestion';
import ClozeTestQuestion from './ClozeTestQuestion';
import SummaryCompletionQuestion from './SummaryCompletionQuestion';
import IELTSMatchingHeadingsQuestion from './IELTSMatchingHeadingsQuestion';
import DiagramLabelingQuestion from './DiagramLabelingQuestion.jsx';
import { getDefaultQuestionData } from '../config/questionTypes';
import InlineIcon from './InlineIcon.jsx';
import './QuestionTypeGuide.css';

const READING_QUESTION_TYPES = [
  {
    id: 'multiple-choice',
    label: 'Trắc nghiệm 1 đáp án',
    description: 'Học sinh chọn 1 đáp án đúng từ 4-5 lựa chọn.',
    response: 'Chọn một đáp án.',
    englishPrompt: 'Choose the correct letter, A, B, C or D.',
    sample: [
      { kind: 'instruction', text: 'Choose the correct letter, A, B, C or D.' },
      { kind: 'prompt', text: 'Which statement is correct?' },
      { kind: 'option', text: 'A. The library opened in 1980.' },
      { kind: 'option', text: 'B. The library opened in 1990.' },
      { kind: 'option', text: 'C. The library opened in 2000.' },
      { kind: 'answer', text: 'Đáp án mẫu: B' },
    ],
  },
  {
    id: 'multi-select',
    label: 'Trắc nghiệm nhiều đáp án',
    description: 'Học sinh chọn nhiều đáp án đúng (tối thiểu 2 đáp án).',
    response: 'Chọn đúng hai đáp án trong danh sách.',
    englishPrompt: 'Choose TWO letters, A-E.',
    sample: [
      { kind: 'instruction', text: 'Choose TWO letters, A-E.' },
      { kind: 'option', text: '[ ] A. The park is open every day.' },
      { kind: 'option', text: '[ ] B. The park has a small lake.' },
      { kind: 'option', text: '[ ] C. The park opened last year.' },
      { kind: 'answer', text: 'Đáp án mẫu: B và C' },
    ],
  },
  {
    id: 'fill-in-the-blanks',
    label: 'Điền vào chỗ trống',
    description: 'Học sinh điền từ hoặc cụm từ để hoàn thành câu (tối đa 3 từ).',
    response: 'Tự nhập từ hoặc cụm từ ngắn.',
    englishPrompt: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS for each answer.',
    sample: [
      { kind: 'instruction', text: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS for each answer.' },
      { kind: 'prompt', text: 'The museum opened in ______.' },
      { kind: 'answer', text: 'Đáp án mẫu: 1890' },
    ],
  },
  {
    id: 'matching',
    label: 'Ghép cặp / Combobox',
    description: 'Học sinh ghép các mục từ cột trái với cột phải.',
    response: 'Ghép từng mục với một lựa chọn.',
    englishPrompt: 'Match each description with the correct place, A-E.',
    sample: [
      { kind: 'instruction', text: 'Match each description with the correct place, A-E.' },
      { kind: 'prompt', text: '1. A place with a large collection of books.  ->  [A, B, C, D, or E]' },
      { kind: 'prompt', text: '2. A place where visitors can see historical objects.  ->  [A, B, C, D, or E]' },
      { kind: 'option', text: 'A. The library' },
      { kind: 'option', text: 'B. The history museum' },
      { kind: 'option', text: 'C. The garden' },
    ],
  },
  {
    id: 'true-false-not-given',
    label: 'True/False/Not Given',
    description: 'Học sinh chọn True, False hoặc Not Given.',
    response: 'Đánh giá thông tin đúng, sai hoặc không được đề cập.',
    englishPrompt: 'Do the following statements agree with the information given in Reading Passage 1? Write TRUE, FALSE or NOT GIVEN.',
    sample: [
      { kind: 'instruction', text: 'Do the following statements agree with the information given in Reading Passage 1?' },
      { kind: 'prompt', text: 'Statement: The library opened in 1890.' },
      { kind: 'option', text: 'Write TRUE, FALSE or NOT GIVEN.' },
    ],
  },
  {
    id: 'yes-no-not-given',
    label: 'Yes/No/Not Given',
    description: 'Học sinh chọn Yes, No hoặc Not Given.',
    response: 'Xác định quan điểm của tác giả: đồng ý, không đồng ý hoặc không đề cập.',
    englishPrompt: 'Do the following statements agree with the writer\'s views? Write YES, NO or NOT GIVEN.',
    sample: [
      { kind: 'instruction', text: 'Do the following statements agree with the writer\'s views?' },
      { kind: 'prompt', text: "Writer's view: The library should open longer." },
      { kind: 'option', text: 'Write YES, NO or NOT GIVEN.' },
    ],
  },
  {
    id: 'cloze-test',
    label: 'Cloze / Notes Completion - Điền chỗ trống trong đoạn/ghi chú',
    description: 'Học sinh điền từ vào các chỗ trống [BLANK] trong đoạn văn, ghi chú hoặc bảng.',
    response: 'Điền từ trực tiếp vào các chỗ trống trong đoạn văn.',
    englishPrompt: 'Complete the notes below. Choose NO MORE THAN TWO WORDS for each answer.',
    sample: [
      { kind: 'instruction', text: 'Complete the notes below. Choose NO MORE THAN TWO WORDS for each answer.' },
      { kind: 'prompt', text: 'Market research: interviews and observations of customers at [1] ______.' },
      { kind: 'prompt', text: 'Marketing aim: give the product a supportive [2] ______.' },
      { kind: 'answer', text: 'Example answers: 1. home   2. image' },
    ],
  },
  {
    id: 'summary-completion',
    label: 'Summary Completion - Complete the summary (word list)',
    description: 'Hoàn thành đoạn tóm tắt bằng cách chọn từ trong danh sách và gán đáp án cho từng [BLANK].',
    response: 'Chọn chữ cái từ danh sách từ cho sẵn để điền vào đoạn tóm tắt.',
    englishPrompt: 'Complete the summary using the list of words A-I below.',
    sample: [
      { kind: 'instruction', text: 'Complete the summary using the list of words A-I below.' },
      { kind: 'option', text: 'A. library   B. station   C. market   ...   I. school' },
      { kind: 'prompt', text: 'The first public building was the [1] ______.' },
      { kind: 'answer', text: 'Đáp án mẫu: 1. A' },
    ],
  },
  {
    id: 'paragraph-matching',
    label: 'Matching Information - Tìm thông tin ở đoạn nào (A-G)',
    description: 'Học sinh tìm thông tin ở đoạn A-G để trả lời câu hỏi.',
    response: 'Chọn đoạn văn A-G có chứa thông tin cần tìm.',
    englishPrompt: 'Which paragraph contains the following information?',
    sample: [
      { kind: 'instruction', text: 'Which paragraph contains the following information?' },
      { kind: 'prompt', text: 'A reference to the rate at which forest habitats are being reduced.' },
      { kind: 'option', text: 'A     B     C     D     E     F     G     H' },
    ],
  },
  {
    id: 'ielts-matching-headings',
    label: 'IX Matching Headings',
    description: 'Ghép mỗi đoạn văn (A-G) với 1 heading phù hợp; có thể có headings dư.',
    response: 'Ghép mỗi đoạn văn với một heading (i-x).',
    englishPrompt: 'Choose the correct heading for each paragraph from the list below.',
    sample: [
      { kind: 'instruction', text: 'Choose the correct heading for each paragraph from the list below.' },
      { kind: 'instruction', text: 'Headings: i. Origins   ii. Growth   iii. A new role' },
      { kind: 'prompt', text: 'Paragraph A  ->  choose one heading: i, ii, or iii' },
      { kind: 'prompt', text: 'Paragraph B  ->  choose one heading: i, ii, or iii' },
    ],
  },
  {
    id: 'diagram-labeling',
    label: 'Diagram Labeling - Gắn nhãn sơ đồ',
    description: 'Tạo diagram có text box và mũi tên; mỗi blank là một câu hỏi con được đánh số liên tiếp.',
    response: 'Điền nhãn vào từng vị trí được đánh số trên sơ đồ.',
    englishPrompt: 'Label the diagram below.',
    sample: [
      { kind: 'instruction', text: 'Label the diagram below.' },
      { kind: 'prompt', text: 'River source  -------->  [1] ______' },
      { kind: 'prompt', text: 'Water wheel  -------->  [2] ______' },
    ],
  },
  {
    id: 'sentence-completion',
    label: 'Hoàn thành câu (chọn từ danh sách)',
    description: 'Học sinh hoàn thành câu bằng cách chọn từ từ danh sách gợi ý.',
    response: 'Chọn từ trong danh sách để hoàn thành câu.',
    sample: [
      { kind: 'instruction', text: 'Complete each sentence using a word from the list below.' },
      { kind: 'option', text: 'Word list: narrow   historic   central' },
      { kind: 'prompt', text: 'The building stands on a ______ street.' },
      { kind: 'answer', text: 'Đáp án mẫu: narrow' },
    ],
    englishPrompt: 'Complete each sentence using a word from the list below.',
  },
  {
    id: 'short-answer',
    label: 'Câu trả lời ngắn',
    description: 'Học sinh viết câu trả lời ngắn (tối đa 3 từ).',
    response: 'Tự viết câu trả lời, thường không quá ba từ.',
    englishPrompt: 'Answer the questions below. Choose NO MORE THAN THREE WORDS from the passage for each answer.',
    sample: [
      { kind: 'prompt', text: 'Why was the library popular?' },
      { kind: 'instruction', text: 'Choose NO MORE THAN THREE WORDS from the passage for each answer.' },
      { kind: 'answer', text: 'Answer: ______' },
    ],
  },
];

const LEGACY_QUESTION_TYPES = READING_QUESTION_TYPES.map(({ id }) => id);

function getReadingQuestionType(typeId) {
  return READING_QUESTION_TYPES.find((type) => type.id === typeId);
}

function ReadingQuestionTypeGuide({ activeType, guideId, onApplyType }) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewTypeId, setPreviewTypeId] = useState(activeType);
  const previewType = getReadingQuestionType(previewTypeId) || READING_QUESTION_TYPES[0];

  const toggleGuide = () => {
    if (!isOpen) {
      setPreviewTypeId(getReadingQuestionType(activeType)?.id || READING_QUESTION_TYPES[0].id);
    }
    setIsOpen((open) => !open);
  };

  return (
    <div className="reading-question-type-guide">
      <button
        type="button"
        className="reading-question-type-guide__toggle"
        aria-expanded={isOpen}
        aria-controls={guideId}
        onClick={toggleGuide}
      >
        {isOpen ? 'Ẩn mẫu các dạng' : 'Xem mẫu các dạng câu hỏi'}
      </button>
      {isOpen && (
        <div className="reading-question-type-guide__panel" id={guideId}>
          <div
            className="reading-question-type-guide__list"
            role="group"
            aria-label="Chọn dạng để xem ví dụ"
          >
            {READING_QUESTION_TYPES.map((type) => (
              <button
                type="button"
                key={type.id}
                className="reading-question-type-guide__type"
                aria-pressed={previewTypeId === type.id}
                onClick={() => setPreviewTypeId(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>
          <div className="reading-question-type-guide__preview" aria-live="polite">
            <h4>{previewType.label}</h4>
            <p className="reading-question-type-guide__description">
              {previewType.description}
            </p>
            <p className="reading-question-type-guide__response">
              <strong>Học sinh sẽ:</strong> {previewType.response}
            </p>
            <div
              className="reading-question-type-guide__sample"
              role="group"
              aria-label="Mẫu câu hỏi"
            >
              {previewType.sample.map((line, index) => (
                <p
                  key={`${line.kind}-${index}`}
                  className={`reading-question-type-guide__sample-line reading-question-type-guide__sample-line--${line.kind}`}
                >
                  {line.text}
                </p>
              ))}
            </div>
            <button
              type="button"
              className="reading-question-type-guide__apply"
              disabled={previewType.id === activeType}
              onClick={() => {
                onApplyType(previewType.id);
                setIsOpen(false);
              }}
            >
              {previewType.id === activeType ? 'Đang dùng loại này' : 'Dùng loại này'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const QuestionSection = ({
  passageIndex,
  sectionIndex,
  section,
  onSectionChange,
  onAddQuestion,
  onDeleteQuestion,
  onCopyQuestion,
  onCopySection,
  onQuestionChange,
  onDeleteSection,
  createDefaultQuestionByType
}) => {
  const primaryBlue = '#0e276f';
  const dangerRed = '#e03';

  // State to track which questions are expanded - first question is expanded by default
  const [expandedQuestions, setExpandedQuestions] = useState(() => {
    const initial = {};
    if (section?.questions && section.questions.length > 0) {
      initial[0] = true; // First question expanded by default
    }
    return initial;
  });

  const toggleQuestionExpand = (questionIndex) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionIndex]: !prev[questionIndex]
    }));
  };

  const collapseAllQuestions = () => {
    setExpandedQuestions({});
  };

  const hasSentenceCompletionQuestion = (section?.questions || []).some(
    (question) => (question?.questionType || question?.type) === 'sentence-completion'
  );
  const legacySentenceCompletionTitleHtml =
    (section?.questions || []).find(
      (question) =>
        (question?.questionType || question?.type) === 'sentence-completion' &&
        String(question?.titleHtml || '').replace(/<[^>]+>/g, '').trim().length > 0
    )?.titleHtml || '';
  const hasOwnSentenceCompletionTitle = Object.prototype.hasOwnProperty.call(
    section || {},
    'sentenceCompletionTitleHtml'
  );
  const sentenceCompletionTitleHtml = hasOwnSentenceCompletionTitle
    ? section?.sentenceCompletionTitleHtml || ''
    : legacySentenceCompletionTitleHtml;
  const sectionQuestions = section?.questions || [];
  const lastQuestion = sectionQuestions[sectionQuestions.length - 1] || null;
  const appendsToDiagram = (lastQuestion?.questionType || lastQuestion?.type) === 'diagram-labeling';

  const applyQuestionType = (question, questionIndex, newType) => {
    const defaultObj = LEGACY_QUESTION_TYPES.includes(newType)
      ? createDefaultQuestionByType(newType)
      : getDefaultQuestionData(newType);
    const newQuestion = {
      ...question,
      ...defaultObj,
      questionNumber: question.questionNumber
    };
    onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', newQuestion);
  };

  return (
    <div style={{
      border: `2px solid ${primaryBlue}`,
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '20px',
      backgroundColor: '#f0f5ff'
    }}>
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '10px', flexWrap: 'wrap' }}>
        <h5 style={{ margin: 0, color: primaryBlue, fontSize: '14px' }}>Section {sectionIndex + 1}</h5>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onCopySection && (
            <button
              type="button"
              onClick={() => onCopySection(passageIndex, sectionIndex)}
              title="Sao chép Section này"
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                backgroundColor: '#0e276f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1a3a8a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#0e276f'}
            >
              Sao chép
            </button>
          )}
          <button
            type="button"
            onClick={() => onDeleteSection(passageIndex, sectionIndex)}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              backgroundColor: dangerRed,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#c60'}
            onMouseLeave={(e) => e.target.style.backgroundColor = dangerRed}
          >
            Xóa Section
          </button>
        </div>
      </div>

      {/* Section Title */}
      <div style={{ marginBottom: '12px', position: 'relative', zIndex: 5 }}>
        <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block', fontSize: '14px' }}>
          Tiêu đề Section:
        </label>
        <input
          type="text"
          placeholder="Ví dụ: Questions 1-7: Matching Headings"
          value={section.sectionTitle || ''}
          onChange={(e) => onSectionChange(passageIndex, sectionIndex, 'sectionTitle', e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #0e276f',
            borderRadius: '4px',
            fontSize: '14px',
            boxSizing: 'border-box',
            backgroundColor: '#fff',
            cursor: 'text',
            position: 'relative',
            zIndex: 5
          }}
          autoComplete="off"
        />
      </div>

      {/* Section Instructions */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block', fontSize: '14px' }}>
          Hướng dẫn (Instructions):
        </label>
        <QuillEditor
          value={section.sectionInstruction || ''}
          onChange={(value) => onSectionChange(passageIndex, sectionIndex, 'sectionInstruction', value)}
        />
        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
          Gợi ý: dùng nút chèn ảnh trên toolbar để thêm hình ảnh hoặc diagram vào nội dung.
        </p>
      </div>

      {hasSentenceCompletionQuestion && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block', fontSize: '14px' }}>
            Tiêu đề chung cho nhóm sentence-completion:
          </label>
          <QuillEditor
            value={sentenceCompletionTitleHtml}
            onChange={(value) =>
              onSectionChange(
                passageIndex,
                sectionIndex,
                'sentenceCompletionTitleHtml',
                value
              )
            }
            placeholder="Ví dụ: Art and the Brain"
            editorMinHeight="90px"
          />
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
            Tiêu đề này sẽ hiển thị một lần phía trên toàn bộ các câu sentence-completion trong section.
          </p>
          {!hasOwnSentenceCompletionTitle && legacySentenceCompletionTitleHtml && (
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#8a6d3b', fontStyle: 'italic' }}>
              Đã phát hiện tiêu đề cũ ở cấp câu hỏi. Khi lưu, tiêu đề này sẽ được chuyển lên cấp section.
            </p>
          )}
        </div>
      )}

      {/* Questions in Section */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '12px', 
        borderRadius: '4px',
        marginBottom: '12px'
      }}>
        <h6 style={{ marginTop: 0, marginBottom: '12px', color: primaryBlue, fontSize: '14px', fontWeight: '600' }}>
          Câu hỏi trong Section ({section.questions?.length || 0})
        </h6>

        {section.questions?.map((question, questionIndex) => {
          const currentQuestionType = question.questionType || 'multiple-choice';
          const currentQuestionTypeInfo = getReadingQuestionType(currentQuestionType);

          return (
          <div key={questionIndex} style={{
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px',
            backgroundColor: '#fafafa'
          }}>
            {/* Question Header with Collapse/Expand */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: expandedQuestions[questionIndex] ? '12px' : '0',
              gap: '4px',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => toggleQuestionExpand(questionIndex)}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: expandedQuestions[questionIndex] ? '#ffc107' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  minWidth: '30px'
                }}
                title={expandedQuestions[questionIndex] ? 'Thu nhỏ' : 'Mở rộng'}
              >
                <InlineIcon name={expandedQuestions[questionIndex] ? 'chevron-down' : 'chevron-right'} size={12} style={{ color: 'white' }} />
              </button>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                Câu {question.questionNumber || '1'} <span style={{ color: '#0e276f', fontSize: '12px', fontWeight: 'normal' }}>({currentQuestionTypeInfo?.label || currentQuestionType})</span>
              </span>
              {expandedQuestions[questionIndex] && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => onCopyQuestion(passageIndex, sectionIndex, questionIndex)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: '#0e276f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title="Copy câu hỏi này"
                  >
                    Sao chép
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteQuestion(passageIndex, sectionIndex, questionIndex)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: dangerRed,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>

            {/* Question Content - Only show when expanded */}
            {expandedQuestions[questionIndex] && (
              <>
                {/* Question Number Input */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '14px' }}>
                    Số câu hỏi (Question Number): <span style={{ color: '#0e276f', fontSize: '12px', fontWeight: 'normal' }}>- {currentQuestionTypeInfo?.label || currentQuestionType}</span>
                  </label>
                  <p style={{ fontSize: '12px', color: '#666', margin: '0 0 6px 0' }}>
                    Ví dụ: 38-40 hoặc 38, 39, 40 hoặc chỉ 38
                  </p>
                  <input
                    type="text"
                    placeholder="Ví dụ: 38-40 hoặc 38, 39, 40"
                    value={question.questionNumber || ''}
                    onChange={(e) => {
                      const input = e.target.value.trim();
                      const newQuestion = {
                        ...question,
                        questionNumber: input || '1'
                      };
                      onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', newQuestion);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '2px solid #0e276f',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff'
                    }}
                  />
                </div>

                {/* Question Type Select */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '14px' }}>
                    Loại câu hỏi: {currentQuestionTypeInfo?.label || question.questionType || '(not set)'}
                  </label>
                  <select
                    value={currentQuestionType}
                    onChange={(e) => {
                      applyQuestionType(question, questionIndex, e.target.value);
                    }}
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      width: '100%'
                    }}
                  >
                    {READING_QUESTION_TYPES.map((type) => (
                      <option key={type.id} value={type.id} title={type.description}>
                        {type.label}
                      </option>
                    ))}
                  </select>

                  {/* Help text for question types */}
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '6px', padding: '8px', backgroundColor: '#f0f8ff', borderRadius: '4px', borderLeft: '3px solid #0e276f' }}>
                    <div>
                      {currentQuestionTypeInfo?.description || 'Chọn dạng câu hỏi phù hợp với cấu trúc trong đề gốc.'}
                    </div>
                    {currentQuestionTypeInfo?.englishPrompt && (
                      <div style={{ marginTop: '6px', color: '#334155' }}>
                        <strong>Mẫu câu lệnh tiếng Anh:</strong> {currentQuestionTypeInfo.englishPrompt}
                      </div>
                    )}
                  </div>
                  <ReadingQuestionTypeGuide
                    activeType={currentQuestionType}
                    guideId={`question-type-guide-${passageIndex}-${sectionIndex}-${questionIndex}`}
                    onApplyType={(typeId) => applyQuestionType(question, questionIndex, typeId)}
                  />
                </div>

                {/* Question Editors by Type */}
                {(question.questionType || 'multiple-choice') === 'multiple-choice' && (
                  <MultipleChoiceQuestion
                    question={question}
                    onChange={(q) => onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', q)}
                    type="abc"
                  />
                )}

                {(question.questionType || 'multiple-choice') === 'multi-select' && (
                  <MultiSelectQuestion
                    question={question}
                    onChange={(q) => onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', q)}
                  />
                )}

                {(question.questionType || 'multiple-choice') === 'fill-in-the-blanks' && (
                  <FillBlankQuestion
                    question={question}
                    onChange={(q) => onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', q)}
                  />
                )}

                {(question.questionType || 'multiple-choice') === 'matching' && (
                  <ComboboxQuestion
                    question={question}
                    onChange={(q) => onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', q)}
                  />
                )}

                {(question.questionType || 'multiple-choice') === 'true-false-not-given' && (
                  <TrueFalseNotGivenQuestion
                    question={question}
                    onChange={(q) => onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', q)}
                  />
                )}

                {(question.questionType || 'multiple-choice') === 'yes-no-not-given' && (
                  <YesNoNotGivenQuestion
                    question={question}
                    onChange={(q) => onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', q)}
                  />
                )}

                {(question.questionType || 'multiple-choice') === 'paragraph-matching' && (
                  <ParagraphMatchingQuestion
                    question={question}
                    onChange={(q) => onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', q)}
                  />
                )}

                {(question.questionType || 'multiple-choice') === 'ielts-matching-headings' && (
                  <IELTSMatchingHeadingsQuestion
                    question={question}
                    onChange={(q) => onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', q)}
                    questionNumbers={question.questionNumber}
                  />
                )}

                {(question.questionType || 'multiple-choice') === 'sentence-completion' && (
                  <SentenceCompletionQuestion
                    question={question}
                    onChange={(q) => onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', q)}
                  />
                )}

                {(question.questionType || 'multiple-choice') === 'cloze-test' && (
                  <ClozeTestQuestion
                    question={question}
                    onChange={(q) => onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', q)}
                  />
                )}

                {(question.questionType || 'multiple-choice') === 'summary-completion' && (
                  <SummaryCompletionQuestion
                    question={question}
                    onChange={(q) => onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', q)}
                  />
                )}

                {(question.questionType || 'multiple-choice') === 'diagram-labeling' && (
                  <DiagramLabelingQuestion
                    question={question}
                    onChange={(q) => onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', q)}
                  />
                )}



                {(question.questionType || 'multiple-choice') === 'short-answer' && (
                  <ShortAnswerQuestion
                    question={question}
                    onChange={(q) => onQuestionChange(passageIndex, sectionIndex, questionIndex, 'full', q)}
                  />
                )}

                {!LEGACY_QUESTION_TYPES.includes(currentQuestionType) && (
                  <div style={{ color: 'red', padding: '8px', backgroundColor: '#ffe0e0', borderRadius: '4px' }}>
                    Unknown question type: {question.questionType}
                  </div>
                )}
              </>
            )}
          </div>
          );
        })}

        {/* Add Question Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
          <button
            type="button"
            onClick={() => {
              onAddQuestion(passageIndex, sectionIndex);
              if (!appendsToDiagram) {
                collapseAllQuestions();
              }
            }}
            style={{
              width: 'auto',
              padding: '8px 12px',
              backgroundColor: primaryBlue,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {appendsToDiagram ? 'Thêm Q vào Diagram hiện tại' : 'Thêm câu hỏi'}
          </button>

          {appendsToDiagram && (
            <button
              type="button"
              onClick={() => {
                onAddQuestion(passageIndex, sectionIndex, { forceNewQuestion: true });
                collapseAllQuestions();
              }}
              style={{
                width: 'auto',
                padding: '8px 12px',
                backgroundColor: '#e2e8f0',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              Tạo block câu hỏi mới
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionSection;
