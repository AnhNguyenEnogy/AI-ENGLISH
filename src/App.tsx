import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Play, Settings, Image as ImageIcon, Video, FileText, Copy, Check } from 'lucide-react';

const TOPICS = [
  "Động vật", "Động vật nông trại", "Động vật hoang dã", "Động vật biển", "Các loài chim",
  "Côn trùng", "Trái cây", "Rau củ", "Đồ ăn", "Đồ uống", "Bữa sáng", "Bánh kẹo",
  "Đồ dùng nhà bếp", "Đồ vật trong nhà", "Đồ vật phòng khách", "Đồ vật phòng ngủ",
  "Đồ vật phòng tắm", "Quần áo", "Giày dép", "Thời tiết", "Các mùa", "Màu sắc",
  "Con số", "Hình dạng", "Bộ phận cơ thể", "Bộ phận khuôn mặt", "Thành viên gia đình",
  "Đồ dùng học tập", "Đồ vật lớp học", "Đồ chơi", "Phương tiện giao thông", "Xe cộ",
  "Nghề nghiệp", "Thể thao", "Nhạc cụ", "Hoạt động hàng ngày", "Thói quen buổi sáng",
  "Thói quen buổi tối", "Cảm xúc", "Tính từ", "Từ trái nghĩa", "Thiên nhiên", "Rừng",
  "Đại dương", "Công viên", "Sở thú", "Bãi biển", "Không gian vũ trụ",
  "Sinh vật tưởng tượng", "Khủng long", "Robot"
];

const SCENE_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function App() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [numScenes, setNumScenes] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedVideo, setCopiedVideo] = useState(false);

  const copySection = (sectionName: string, setCopied: (v: boolean) => void) => {
    if (!result) return;
    const parts = result.split(/(?=SCENE SCRIPTS|IMAGE PROMPTS|VIDEO PROMPTS)/);
    const section = parts.find(p => p.trim().startsWith(sectionName));
    if (section) {
      const textToCopy = section.replace(sectionName, '').trim();
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generateContent = async () => {
    setLoading(true);
    setResult('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an AI product designer and prompt engineer.
Generate content for short animated educational videos where a Vietnamese father teaches his young son English vocabulary.

Topic: ${topic}
Number of scenes: ${numScenes}

APP PURPOSE
The application generates short learning scenes where a father teaches English words to his son by pointing at animals or objects that appear clearly in front of them.
The father asks questions in Vietnamese.
The son answers with the English word.
All scripts must be written in Vietnamese.
All prompts must be written in English.

VIDEO STYLE
All scenes must follow this visual style:
High-quality 3D animated film style inspired by modern Western animated cinema, soft rounded and friendly character designs, slightly exaggerated facial expressions for emotional clarity, clean and smooth surfaces, richly detailed yet whimsical environments, cinematic lighting with warm golden-hour tones, soft shadows and gentle depth of field, non-photorealistic, stylized realism, emotionally expressive, heartwarming tone, professional studio-quality animation, no text overlays. quality 4K

CHARACTERS
Father: Vietnamese father, about 30 years old, kind and gentle, casual clothes.
Son: Vietnamese boy, 5 years old, cute face, big eyes, round cheeks, cheerful personality.

VERY IMPORTANT CAMERA RULE
The camera must always face the characters from the FRONT.
Both father and son must always stand next to each other and face the camera.
The animal or object must also appear in the SAME FRAME close to them.
The father must be able to POINT at the object or animal.
The object must NOT be far away.
Everything must appear clearly in one frame.

SCENE STRUCTURE
Each scene must contain:
a clear environment
a visible animal or object
father pointing at it
son looking at it
The animal or object must be close to them inside the same frame.

Each scene must contain EXACTLY:
Father question 1
Son answer
Father question 2
Son answer

OUTPUT FORMAT
The output must contain exactly three sections formatted exactly like the example below. Do not use Markdown headings like "#", just use the exact text for section headers.

SCENE SCRIPTS
Must be written in Vietnamese. Each scene script must be on a single paragraph.

IMAGE PROMPTS
All prompts must be written in English.
Each prompt must include: front camera view, father and son standing side by side, animal or object close to them, father pointing at object, son looking at object.
Each prompt MUST include this exact style description at the end: "High-quality 3D animated film style inspired by modern Western animated cinema, soft rounded and friendly character designs, slightly exaggerated facial expressions for emotional clarity, clean and smooth surfaces, richly detailed yet whimsical environments, cinematic lighting with warm golden-hour tones, soft shadows and gentle depth of field, non-photorealistic, stylized realism, emotionally expressive, heartwarming tone, professional studio-quality animation, no text overlays. quality 4K"
Each prompt must be on a SEPARATE LINE. Each line contains EXACTLY ONE prompt. Do NOT combine multiple prompts in the same line. Do NOT use "." to separate prompts.

VIDEO PROMPTS
All prompts must be written in English.
Each prompt must include: front camera angle, father and son standing together, animal or object close in front of them, father pointing at object, son answering.
Each prompt MUST include this exact style description at the end: "High-quality 3D animated film style inspired by modern Western animated cinema, soft rounded and friendly character designs, slightly exaggerated facial expressions for emotional clarity, clean and smooth surfaces, richly detailed yet whimsical environments, cinematic lighting with warm golden-hour tones, soft shadows and gentle depth of field, non-photorealistic, stylized realism, emotionally expressive, heartwarming tone, professional studio-quality animation, no text overlays. quality 4K"
Each prompt must be on a SEPARATE LINE. Each line contains EXACTLY ONE prompt. Do NOT combine multiple prompts in the same line.

ADDITIONAL CORRECTION RULES
The output format must be strictly followed.
Each IMAGE PROMPT must be written on a separate line.
Each VIDEO PROMPT must be written on a separate line.
One line must contain exactly ONE prompt.
Do NOT combine multiple prompts in one line.
Do NOT separate prompts using "." or any punctuation.

The number of IMAGE PROMPTS must be exactly the same as the number of scenes.
The number of VIDEO PROMPTS must be exactly the same as the number of scenes.

VIDEO PROMPTS must include the EXACT dialogue from SCENE SCRIPTS.
The father must speak Vietnamese.
The son must answer in English.
The dialogue must appear inside quotation marks.

Example dialogue format inside video prompt:
father says "Bi ơi, con mèo tiếng Anh là gì?"
boy answers "Cat!"
father asks "Thế còn con chó thì sao con?"
boy answers "Dog!"

Do not change the wording of the dialogue.
Do not summarize the dialogue.
The dialogue in VIDEO PROMPTS must match the dialogue in SCENE SCRIPTS exactly.

EXAMPLE OUTPUT FORMAT:

SCENE SCRIPTS
Scene 1 – Khu linh trưởng và voi Cha và Bi đứng cạnh nhau trong sở thú. Trước mặt họ là một con khỉ nhỏ đang ngồi trên tảng đá gần hàng rào. Cha chỉ vào con khỉ và hỏi: "Bi ơi, con khỉ tiếng Anh là gì con?" Con nhìn con khỉ và trả lời: "Monkey!" Ngay cạnh đó là một chú voi con đang đứng ăn cỏ. Cha chỉ vào con voi và hỏi: "Thế còn con voi thì sao con?" Con trả lời: "Elephant!"
Scene 2 – Đồng cỏ Safari Cha và Bi đứng cạnh nhau bên hàng rào gỗ. Trước mặt họ là một con sư tử con đang nằm sưởi nắng. Cha chỉ vào con sư tử và hỏi: "Bi ơi, con sư tử tiếng Anh là gì?" Con nhìn con sư tử và trả lời: "Lion!" Ngay cạnh đó có một con hươu cao cổ nhỏ đang cúi đầu xuống gần họ. Cha chỉ vào con hươu cao cổ và hỏi: "Thế còn con hươu cao cổ này thì sao con?" Con trả lời: "Giraffe!"

IMAGE PROMPTS
Scene 1 – Front camera view, a 30-year-old gentle Vietnamese father in casual clothes and his 5-year-old cute Vietnamese son with round cheeks and big eyes standing side by side facing the camera in a zoo enclosure, a cute baby monkey and a baby elephant are very close to them in the same frame, the father is pointing at the baby monkey, the son is looking cheerfully at the baby monkey, High-quality 3D animated film style inspired by modern Western animated cinema, soft rounded and friendly character designs, slightly exaggerated facial expressions for emotional clarity, clean and smooth surfaces, richly detailed yet whimsical environments, cinematic lighting with warm golden-hour tones, soft shadows and gentle depth of field, non-photorealistic, stylized realism, emotionally expressive, heartwarming tone, professional studio-quality animation, no text overlays. quality 4K
Scene 2 – Front camera view, a 30-year-old gentle Vietnamese father in casual clothes and his 5-year-old cute Vietnamese son with round cheeks and big eyes standing side by side facing the camera next to a low wooden fence in a zoo, a cute baby lion and a baby giraffe are very close to them in the same frame, the father is pointing at the baby lion, the son is looking cheerfully at the baby lion, High-quality 3D animated film style inspired by modern Western animated cinema, soft rounded and friendly character designs, slightly exaggerated facial expressions for emotional clarity, clean and smooth surfaces, richly detailed yet whimsical environments, cinematic lighting with warm golden-hour tones, soft shadows and gentle depth of field, non-photorealistic, stylized realism, emotionally expressive, heartwarming tone, professional studio-quality animation, no text overlays. quality 4K

VIDEO PROMPTS
Scene 1 – Front camera angle, a 30-year-old gentle Vietnamese father and his cute 5-year-old son standing together side by side facing the camera in a zoo, a baby monkey and a baby elephant are close in front of them in the same frame, the father points his finger at the baby monkey and speaks, the boy looks at the monkey and answers cheerfully, High-quality 3D animated film style inspired by modern Western animated cinema, soft rounded and friendly character designs, slightly exaggerated facial expressions for emotional clarity, clean and smooth surfaces, richly detailed yet whimsical environments, cinematic lighting with warm golden-hour tones, soft shadows and gentle depth of field, non-photorealistic, stylized realism, emotionally expressive, heartwarming tone, professional studio-quality animation, no text overlays. quality 4K
Scene 2 – Front camera angle, a 30-year-old gentle Vietnamese father and his cute 5-year-old son standing together side by side facing the camera by a low wooden zoo fence, a baby lion and a baby giraffe are close in front of them in the same frame, the father points his finger at the baby lion and speaks, the boy looks at the lion and answers cheerfully, High-quality 3D animated film style inspired by modern Western animated cinema, soft rounded and friendly character designs, slightly exaggerated facial expressions for emotional clarity, clean and smooth surfaces, richly detailed yet whimsical environments, cinematic lighting with warm golden-hour tones, soft shadows and gentle depth of field, non-photorealistic, stylized realism, emotionally expressive, heartwarming tone, professional studio-quality animation, no text overlays. quality 4K`;

      const response = await ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });

      let fullText = '';
      for await (const chunk of response) {
        fullText += chunk.text;
        setResult(fullText);
      }
    } catch (error) {
      console.error(error);
      setResult('Error generating content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Play size={20} fill="currentColor" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">EduVideo PromptGen</h1>
              <p className="text-xs text-slate-500 font-medium">Vietnamese-English Series</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Settings size={18} className="text-slate-400" />
                Generation Settings
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Topic (Chủ đề)
                  </label>
                  <select
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="numScenes" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Number of Scenes
                  </label>
                  <select
                    id="numScenes"
                    value={numScenes}
                    onChange={(e) => setNumScenes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    {SCENE_COUNTS.map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? 'Scene' : 'Scenes'}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={generateContent}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Generate Content
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2">Style Guidelines</h3>
              <ul className="text-xs text-indigo-800 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span><strong>High-quality 3D animated film</strong>, modern Western cinema style</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span><strong>Front camera view</strong> only</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Father & son standing side-by-side</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Object close to them in the same frame</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <FileText size={16} className="text-slate-400" /> Scripts
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <ImageIcon size={16} className="text-slate-400" /> Image Prompts
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <Video size={16} className="text-slate-400" /> Video Prompts
                  </div>
                </div>
                
                {result && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copySection('IMAGE PROMPTS', setCopiedImage)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors text-slate-600 shadow-sm"
                    >
                      {copiedImage ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      Copy Image Prompts
                    </button>
                    <button
                      onClick={() => copySection('VIDEO PROMPTS', setCopiedVideo)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors text-slate-600 shadow-sm"
                    >
                      {copiedVideo ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      Copy Video Prompts
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 flex-1 overflow-auto">
                {!result && !loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                      <Play size={24} className="text-slate-300" />
                    </div>
                    <p className="text-sm">Select a topic and click Generate to create content.</p>
                  </div>
                ) : (
                  <div className="prose prose-slate prose-sm max-w-none prose-p:leading-relaxed whitespace-pre-wrap font-sans">
                    {result}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
