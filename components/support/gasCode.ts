import { SurveyPattern } from '../../types';

const escapeString = (str: string): string => {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "");
};

export const generateGasCode = (pattern: SurveyPattern): string => {
  const qCode = pattern.questions.map(q => {
    const cleanTitle = escapeString(q.title);
    const cleanHelp = q.helpText ? escapeString(q.helpText) : '';
    const helpLine = cleanHelp ? `.setHelpText('${cleanHelp}')` : '';
    const reqLine = q.required ? `.setRequired(true)` : `.setRequired(false)`;
    switch (q.type) {
      case 'TEXT':
        return `  form.addTextItem()\n    .setTitle('${cleanTitle}')\n    ${helpLine}\n    ${reqLine};`;
      case 'PARAGRAPH':
        return `  form.addParagraphTextItem()\n    .setTitle('${cleanTitle}')\n    ${helpLine}\n    ${reqLine};`;
      case 'RADIO': {
        const opts = q.options?.map(o => `'${escapeString(o)}'`).join(', ') || '';
        return `  form.addMultipleChoiceItem()\n    .setTitle('${cleanTitle}')\n    .setChoiceValues([${opts}])\n    ${helpLine}\n    ${reqLine};`;
      }
      case 'CHECKBOX': {
        const opts = q.options?.map(o => `'${escapeString(o)}'`).join(', ') || '';
        return `  form.addCheckboxItem()\n    .setTitle('${cleanTitle}')\n    .setChoiceValues([${opts}])\n    ${helpLine}\n    ${reqLine};`;
      }
      case 'SCALE':
        // NPS: 0〜10 の均等目盛
        return `  form.addScaleItem()\n    .setTitle('${cleanTitle}')\n    .setBounds(0, 10)\n    ${helpLine}\n    ${reqLine};`;
    }
  }).join('\n\n');

  return `function createSurveyForm() {
  // 1. フォームを作成
  var form = FormApp.create('${escapeString(pattern.formTitle)}');
  form.setDescription('${escapeString(pattern.formDescription)}');

  // 2. 質問を追加
${qCode}

  // 3. URLをログに出力
  Logger.log('--------------------------------------------------');
  Logger.log('編集用URL (管理者用): ' + form.getEditUrl());
  Logger.log('回答用URL (公開用): ' + form.getPublishedUrl());
  Logger.log('--------------------------------------------------');
}`;
};
