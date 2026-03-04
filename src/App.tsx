import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Play, Settings, Image as ImageIcon, Video, FileText, Copy, Check, Upload, X, Download } from 'lucide-react';

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

const CHARACTER_PAIRS = [
  { id: "Father and Son", label: "Cha và Con trai" },
  { id: "Father and Daughter", label: "Cha và Con gái" },
  { id: "Mother and Son", label: "Mẹ và Con trai" },
  { id: "Mother and Daughter", label: "Mẹ và Con gái" }
];

const CLOTHING_MODES = [
  { id: "Fixed clothing", label: "Trang phục cố định" },
  { id: "Automatic clothing", label: "Trang phục tự động" }
];

const AUTO_IMAGE_OPTIONS = [
  { id: "YES", label: "CÓ" },
  { id: "NO", label: "KHÔNG" }
];

export default function App() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [numScenes, setNumScenes] = useState(1);
  const [characterPair, setCharacterPair] = useState(CHARACTER_PAIRS[0].id);
  const [childName, setChildName] = useState('');
  const [clothingMode, setClothingMode] = useState(CLOTHING_MODES[0].id);
  const [autoGenerateImages, setAutoGenerateImages] = useState(AUTO_IMAGE_OPTIONS[0].id);
  const [parentImage, setParentImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [childImage, setChildImage] = useState<{ data: string, mimeType: string } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedVideo, setCopiedVideo] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
  const [generatingImages, setGeneratingImages] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setImage: (img: { data: string, mimeType: string } | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImage({ data: base64String, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
    }
  };

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

  const extractImagePrompts = (text: string) => {
    const parts = text.split(/(?=SCENE SCRIPTS|IMAGE PROMPTS|VIDEO PROMPTS)/);
    const imageSection = parts.find(p => p.trim().startsWith('IMAGE PROMPTS'));
    if (!imageSection) return [];
    
    const lines = imageSection.replace('IMAGE PROMPTS', '').trim().split('\n').filter(l => l.trim() !== '' && l.trim().startsWith('Scene'));
    return lines;
  };

  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/\s+/g, '');
  };

  const handleDownloadImage = (index: number, dataUrl: string) => {
    const cleanTopic = removeAccents(topic);
    const sceneId = (index + 1).toString().padStart(2, '0');
    const filename = `${cleanTopic}_${sceneId}.png`;
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateImages = async (promptsToUse?: string[]) => {
    const prompts = promptsToUse || extractImagePrompts(result);
    if (prompts.length === 0) return;
    
    setGeneratingImages(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const newImages = { ...generatedImages };
      
      for (let i = 0; i < prompts.length; i++) {
        const promptText = prompts[i];
        
        const parts: any[] = [];
        
        if (parentImage) {
          parts.push({ inlineData: { data: parentImage.data, mimeType: parentImage.mimeType } });
        }
        if (childImage) {
          parts.push({ inlineData: { data: childImage.data, mimeType: childImage.mimeType } });
        }
        
        parts.push({ text: promptText });
        
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
          });
          
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              newImages[i] = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              setGeneratedImages({ ...newImages });
              break;
            }
          }
        } catch (err) {
          console.error(`Error generating image for scene ${i + 1}:`, err);
        }
      }
    } catch (error) {
      console.error("Error generating images:", error);
    } finally {
      setGeneratingImages(false);
    }
  };

  const generateContent = async () => {
    setLoading(true);
    setResult('');
    setGeneratedImages({});
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let parentRole = characterPair.includes("Father") ? "Father" : "Mother";
      let childRole = characterPair.includes("Son") ? "Son" : "Daughter";
      
      let defaultChildName = childRole === "Son" ? "con trai" : "con gái";
      let actualChildName = childName.trim() !== "" ? childName.trim() : defaultChildName;
      
      let parentVietnamese = parentRole === "Father" ? "Cha" : "Mẹ";
      
      const promptText = `You are an AI product designer and prompt engineer.
Generate content for short animated educational videos where a Vietnamese ${parentRole.toLowerCase()} teaches their young ${childRole.toLowerCase()} English vocabulary.

Topic: ${topic}
Number of scenes: ${numScenes}

CHARACTER SYSTEM
Character Pair: ${characterPair}
Child's Name: ${actualChildName}
Parent Role in Vietnamese: ${parentVietnamese}

If reference images are provided (attached to this prompt), you MUST:
1. Analyze the reference images.
2. Describe the character appearance (hair style, hair color, face shape, skin tone, age appearance, facial features, general body type).
3. Use that exact appearance description consistently in all IMAGE PROMPTS and VIDEO PROMPTS.

If no reference images are provided, use this DEFAULT CHARACTER STYLE:
Vietnamese ${parentRole.toLowerCase()} around 30 years old, Vietnamese ${childRole.toLowerCase()} around 5 years old.
Style: cute animated Pixar style, friendly facial expressions, round soft facial features.

CLOTHING MODE: ${clothingMode}
If "Fixed clothing": The clothing remains the exact same in all scenes (e.g., ${parentRole.toLowerCase()} wearing blue shirt and jeans, ${childRole.toLowerCase()} wearing yellow T-shirt and shorts).
If "Automatic clothing": Clothing automatically adapts to the scene environment (e.g., kitchen -> casual home clothes, park -> outdoor casual clothes).

APP PURPOSE
The application generates short learning scenes where a ${parentRole.toLowerCase()} teaches English words to their ${childRole.toLowerCase()} by pointing at animals or objects that appear clearly in front of them.
The ${parentRole.toLowerCase()} asks questions in Vietnamese.
The ${childRole.toLowerCase()} answers with the English word.
All scripts must be written in Vietnamese.
All prompts must be written in English.

VIDEO STYLE
All scenes must follow this visual style:
High-quality 3D animated film style inspired by modern Western animated cinema, soft rounded and friendly character designs, slightly exaggerated facial expressions for emotional clarity, clean and smooth surfaces, richly detailed yet whimsical environments, cinematic lighting with warm golden-hour tones, soft shadows and gentle depth of field, non-photorealistic, stylized realism, emotionally expressive, heartwarming tone, professional studio-quality animation, no text overlays. quality 4K

VERY IMPORTANT CAMERA RULE
The camera must always face the characters from the FRONT.
Both ${parentRole.toLowerCase()} and ${childRole.toLowerCase()} must always stand next to each other and face the camera.
The animal or object must also appear in the SAME FRAME close to them.
The ${parentRole.toLowerCase()} must be able to POINT at the object or animal.
The object must NOT be far away.
Everything must appear clearly in one frame.

SCENE STRUCTURE
Each scene must contain:
a clear environment
a visible animal or object
${parentRole.toLowerCase()} pointing at it
${childRole.toLowerCase()} looking at it
The animal or object must be close to them inside the same frame.

Each scene must contain EXACTLY:
${parentRole} question 1
${childRole} answer
${parentRole} question 2
${childRole} answer

OUTPUT FORMAT
The output must contain exactly three sections formatted exactly like the example below. Do not use Markdown headings like "#", just use the exact text for section headers.

SCENE SCRIPTS
Must be written in Vietnamese. Each scene script must be on a single paragraph.
Example dialogue format:
${parentVietnamese} hỏi: "${actualChildName} ơi, con mèo tiếng Anh là gì?"
Con trả lời: "Cat!"

IMAGE PROMPTS
All prompts must be written in English.
Each prompt must include: character descriptions, character clothing, reference appearance if provided, front camera view, ${parentRole.toLowerCase()} and ${childRole.toLowerCase()} standing side by side, animal or object close to them, ${parentRole.toLowerCase()} pointing at object, ${childRole.toLowerCase()} looking at object.
Each prompt MUST include this exact style description at the end: "High-quality 3D animated film style inspired by modern Western animated cinema, soft rounded and friendly character designs, slightly exaggerated facial expressions for emotional clarity, clean and smooth surfaces, richly detailed yet whimsical environments, cinematic lighting with warm golden-hour tones, soft shadows and gentle depth of field, non-photorealistic, stylized realism, emotionally expressive, heartwarming tone, professional studio-quality animation, no text overlays. quality 4K"
Each prompt must be on a SEPARATE LINE. Each line contains EXACTLY ONE prompt. Do NOT combine multiple prompts in the same line. Do NOT use "." to separate prompts.

VIDEO PROMPTS
All prompts must be written in English.
Each prompt must include: same character description, same character clothing, same character appearance, same animation style, front camera angle, ${parentRole.toLowerCase()} and ${childRole.toLowerCase()} standing together, animal or object close in front of them, ${parentRole.toLowerCase()} pointing at object, ${childRole.toLowerCase()} answering.
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
The ${parentRole.toLowerCase()} must speak Vietnamese.
The ${childRole.toLowerCase()} must answer in English.
The dialogue must appear inside quotation marks.

Example dialogue format inside video prompt:
${parentRole.toLowerCase()} says "${actualChildName} ơi, con mèo tiếng Anh là gì?"
${childRole.toLowerCase()} answers "Cat!"
${parentRole.toLowerCase()} asks "Thế còn con chó thì sao con?"
${childRole.toLowerCase()} answers "Dog!"

Do not change the wording of the dialogue.
Do not summarize the dialogue.
The dialogue in VIDEO PROMPTS must match the dialogue in SCENE SCRIPTS exactly.

EXAMPLE OUTPUT FORMAT:

SCENE SCRIPTS
Scene 1 – Khu linh trưởng và voi ${parentVietnamese} và ${actualChildName} đứng cạnh nhau trong sở thú. Trước mặt họ là một con khỉ nhỏ đang ngồi trên tảng đá gần hàng rào. ${parentVietnamese} chỉ vào con khỉ và hỏi: "${actualChildName} ơi, con khỉ tiếng Anh là gì con?" Con nhìn con khỉ và trả lời: "Monkey!" Ngay cạnh đó là một chú voi con đang đứng ăn cỏ. ${parentVietnamese} chỉ vào con voi và hỏi: "Thế còn con voi thì sao con?" Con trả lời: "Elephant!"
Scene 2 – Đồng cỏ Safari ${parentVietnamese} và ${actualChildName} đứng cạnh nhau bên hàng rào gỗ. Trước mặt họ là một con sư tử con đang nằm sưởi nắng. ${parentVietnamese} chỉ vào con sư tử và hỏi: "${actualChildName} ơi, con sư tử tiếng Anh là gì?" Con nhìn con sư tử và trả lời: "Lion!" Ngay cạnh đó có một con hươu cao cổ nhỏ đang cúi đầu xuống gần họ. ${parentVietnamese} chỉ vào con hươu cao cổ và hỏi: "Thế còn con hươu cao cổ này thì sao con?" Con trả lời: "Giraffe!"

IMAGE PROMPTS
Scene 1 – Front camera view, [Character Description of ${parentRole}], [Character Description of ${childRole}], standing side by side facing the camera in a zoo enclosure, a cute baby monkey and a baby elephant are very close to them in the same frame, the ${parentRole.toLowerCase()} is pointing at the baby monkey, the ${childRole.toLowerCase()} is looking cheerfully at the baby monkey, High-quality 3D animated film style inspired by modern Western animated cinema, soft rounded and friendly character designs, slightly exaggerated facial expressions for emotional clarity, clean and smooth surfaces, richly detailed yet whimsical environments, cinematic lighting with warm golden-hour tones, soft shadows and gentle depth of field, non-photorealistic, stylized realism, emotionally expressive, heartwarming tone, professional studio-quality animation, no text overlays. quality 4K
Scene 2 – Front camera view, [Character Description of ${parentRole}], [Character Description of ${childRole}], standing side by side facing the camera next to a low wooden fence in a zoo, a cute baby lion and a baby giraffe are very close to them in the same frame, the ${parentRole.toLowerCase()} is pointing at the baby lion, the ${childRole.toLowerCase()} is looking cheerfully at the baby lion, High-quality 3D animated film style inspired by modern Western animated cinema, soft rounded and friendly character designs, slightly exaggerated facial expressions for emotional clarity, clean and smooth surfaces, richly detailed yet whimsical environments, cinematic lighting with warm golden-hour tones, soft shadows and gentle depth of field, non-photorealistic, stylized realism, emotionally expressive, heartwarming tone, professional studio-quality animation, no text overlays. quality 4K

VIDEO PROMPTS
Scene 1 – Front camera angle, [Character Description of ${parentRole}], [Character Description of ${childRole}], standing together side by side facing the camera in a zoo, a baby monkey and a baby elephant are close in front of them in the same frame, the ${parentRole.toLowerCase()} points his finger at the baby monkey and says "${actualChildName} ơi, con khỉ tiếng Anh là gì con?", the ${childRole.toLowerCase()} looks at the monkey and answers "Monkey!", High-quality 3D animated film style inspired by modern Western animated cinema, soft rounded and friendly character designs, slightly exaggerated facial expressions for emotional clarity, clean and smooth surfaces, richly detailed yet whimsical environments, cinematic lighting with warm golden-hour tones, soft shadows and gentle depth of field, non-photorealistic, stylized realism, emotionally expressive, heartwarming tone, professional studio-quality animation, no text overlays. quality 4K
Scene 2 – Front camera angle, [Character Description of ${parentRole}], [Character Description of ${childRole}], standing together side by side facing the camera by a low wooden zoo fence, a baby lion and a baby giraffe are close in front of them in the same frame, the ${parentRole.toLowerCase()} points his finger at the baby lion and says "${actualChildName} ơi, con sư tử tiếng Anh là gì?", the ${childRole.toLowerCase()} looks at the lion and answers "Lion!", High-quality 3D animated film style inspired by modern Western animated cinema, soft rounded and friendly character designs, slightly exaggerated facial expressions for emotional clarity, clean and smooth surfaces, richly detailed yet whimsical environments, cinematic lighting with warm golden-hour tones, soft shadows and gentle depth of field, non-photorealistic, stylized realism, emotionally expressive, heartwarming tone, professional studio-quality animation, no text overlays. quality 4K`;

      const parts: any[] = [];
      
      if (parentImage) {
        parts.push({ text: "Here is the reference image for the Parent:" });
        parts.push({ inlineData: { data: parentImage.data, mimeType: parentImage.mimeType } });
      }
      if (childImage) {
        parts.push({ text: "Here is the reference image for the Child:" });
        parts.push({ inlineData: { data: childImage.data, mimeType: childImage.mimeType } });
      }
      
      parts.push({ text: promptText });

      const response = await ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: { parts },
      });

      let fullText = '';
      for await (const chunk of response) {
        fullText += chunk.text;
        setResult(fullText);
      }
      
      if (autoGenerateImages === 'YES') {
        const extractedPrompts = extractImagePrompts(fullText);
        if (extractedPrompts.length > 0) {
          generateImages(extractedPrompts);
        }
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
                Cài đặt tạo nội dung
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label htmlFor="characterPair" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nhân vật
                  </label>
                  <select
                    id="characterPair"
                    value={characterPair}
                    onChange={(e) => setCharacterPair(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    {CHARACTER_PAIRS.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="childName" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Tên của bé (Không bắt buộc)
                  </label>
                  <input
                    type="text"
                    id="childName"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder={`VD: Bi (Mặc định: ${characterPair.includes("Son") ? "con trai" : "con gái"})`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="clothingMode" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Chế độ trang phục
                  </label>
                  <select
                    id="clothingMode"
                    value={clothingMode}
                    onChange={(e) => setClothingMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    {CLOTHING_MODES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Ảnh tham chiếu (Không bắt buộc)
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Parent Image Upload */}
                    <div className="relative">
                      {parentImage ? (
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-slate-200">
                          <img src={`data:${parentImage.mimeType};base64,${parentImage.data}`} alt="Parent Ref" className="w-full h-full object-cover" />
                          <button onClick={() => setParentImage(null)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black/70">
                            <X size={14} />
                          </button>
                          <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] text-center py-1">Ảnh cha/mẹ</div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full aspect-square bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                          <Upload size={20} className="text-slate-400 mb-2" />
                          <span className="text-xs text-slate-500 font-medium">Ảnh cha/mẹ</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setParentImage)} />
                        </label>
                      )}
                    </div>

                    {/* Child Image Upload */}
                    <div className="relative">
                      {childImage ? (
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-slate-200">
                          <img src={`data:${childImage.mimeType};base64,${childImage.data}`} alt="Child Ref" className="w-full h-full object-cover" />
                          <button onClick={() => setChildImage(null)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black/70">
                            <X size={14} />
                          </button>
                          <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] text-center py-1">Ảnh của bé</div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full aspect-square bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                          <Upload size={20} className="text-slate-400 mb-2" />
                          <span className="text-xs text-slate-500 font-medium">Ảnh của bé</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setChildImage)} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Chủ đề
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
                    Số cảnh
                  </label>
                  <select
                    id="numScenes"
                    value={numScenes}
                    onChange={(e) => setNumScenes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    {SCENE_COUNTS.map((n) => (
                      <option key={n} value={n}>{n} cảnh</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="autoGenerateImages" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Tự động tạo ảnh
                  </label>
                  <select
                    id="autoGenerateImages"
                    value={autoGenerateImages}
                    onChange={(e) => setAutoGenerateImages(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    {AUTO_IMAGE_OPTIONS.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
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
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Tạo nội dung
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2">Hướng dẫn phong cách</h3>
              <ul className="text-xs text-indigo-800 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span><strong>Phim hoạt hình 3D chất lượng cao</strong>, phong cách điện ảnh phương Tây hiện đại</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Chỉ sử dụng <strong>góc máy phía trước</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Cha/mẹ và bé đứng cạnh nhau</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Đồ vật nằm gần họ trong cùng một khung hình</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <FileText size={16} className="text-slate-400" /> Kịch bản
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <ImageIcon size={16} className="text-slate-400" /> Prompt Ảnh
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <Video size={16} className="text-slate-400" /> Prompt Video
                  </div>
                </div>
                
                {result && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copySection('IMAGE PROMPTS', setCopiedImage)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors text-slate-600 shadow-sm"
                    >
                      {copiedImage ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {copiedImage ? 'Đã chép' : 'Sao chép Prompt Ảnh'}
                    </button>
                    <button
                      onClick={() => copySection('VIDEO PROMPTS', setCopiedVideo)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors text-slate-600 shadow-sm"
                    >
                      {copiedVideo ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {copiedVideo ? 'Đã chép' : 'Sao chép Prompt Video'}
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
                    <p className="text-sm">Chọn chủ đề và nhấn Tạo nội dung để bắt đầu.</p>
                  </div>
                ) : (
                  <div className="prose prose-slate prose-sm max-w-none prose-p:leading-relaxed whitespace-pre-wrap font-sans">
                    {result}
                  </div>
                )}
              </div>
            </div>

            {/* Render Images Section */}
            {(extractImagePrompts(result).length > 0 || Object.keys(generatedImages).length > 0) && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ImageIcon size={20} className="text-indigo-600" />
                    Ảnh đã tạo
                  </h3>
                  <button
                    onClick={() => generateImages()}
                    disabled={generatingImages || extractImagePrompts(result).length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {generatingImages ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                    Tạo ảnh
                  </button>
                </div>
                
                <div className="space-y-8">
                  {extractImagePrompts(result).map((prompt, index) => (
                    <div key={index} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-2">Cảnh {index + 1}</h4>
                      <p className="text-xs text-slate-500 mb-4">{prompt}</p>
                      
                      {generatedImages[index] ? (
                        <div className="space-y-4">
                          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                            <img src={generatedImages[index]} alt={`Cảnh ${index + 1}`} className="w-full object-cover" />
                          </div>
                          <button
                            onClick={() => handleDownloadImage(index, generatedImages[index])}
                            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                          >
                            <Download size={16} />
                            Tải ảnh
                          </button>
                        </div>
                      ) : generatingImages ? (
                        <div className="w-full aspect-video bg-slate-200 animate-pulse rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                          <Loader2 size={24} className="animate-spin" />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
