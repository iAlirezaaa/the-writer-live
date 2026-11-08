// Shared public feedback transport. GitHub Pages has no writable backend.
// A reader must confirm submission on GitHub; never claim a draft was saved.
const REPO = "iAlirezaaa/the-writer-live";
const WEB = "https://github.com/" + REPO;
const API = "https://api.github.com/repos/" + REPO + "/issues";
export function openPublicFeedback({story,quote="",name="",text="",rating="",category="general"}) {
  if(!story?.id) throw new Error("شناسهٔ داستان نامعتبر است");
  const title = String(story.title || "اثر بی‌عنوان");
  const safeQuote = String(quote).replace(/\s+/g," ").trim().slice(0,300);
  const safeText = String(text).trim().slice(0,2500);
  if(safeText.length < 10) throw new Error("نظر باید دست‌کم ۱۰ نویسه داشته باشد.");
  const kind = safeQuote ? "Margin" : "General";
  const body=[
    "## The Writer — reader feedback",
    "Story ID: " + String(story.id),
    "Story title: " + title,
    "Type: " + kind,
    "Category: " + category,
    "Rating: " + (rating || "not specified"),
    "Reader: " + (String(name).trim().slice(0,40) || "ناشناس"),
    "",
    "## Selected passage",
    safeQuote || "(general feedback)",
    "",
    "## Reader comment",
    safeText,
    "",
    "---",
    "This feedback is a reader submission, not an editorially verified statement."
  ].join("\n");
  const issueTitle = "[Reader " + (safeQuote?"margin":"feedback") + "] #" + story.id + " — " + title;
  const url = WEB + "/issues/new?" + new URLSearchParams({title:issueTitle,body});
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if(!opened) {
    // Popup blockers may block a window: provide a navigable link in the existing UI.
    return {url, opened:false};
  }
  return {url, opened:true};
}
export function openPublicVote({story,value}) {
  if(!story?.id || ![1,-1].includes(value))throw new Error("رأی یا شناسهٔ داستان نامعتبر است");
  const label=value===1?"like":"dislike";
  const title=String(story.title||"اثر بی‌عنوان").slice(0,140);
  const body=[
    "## The Writer — reader vote",
    "Story ID: "+String(story.id),
    "Story title: "+title,
    "Vote: "+label,
    "",
    "Reader feedback is a subjective signal, not an instruction to the author.",
    "GitHub account attribution is used to prevent duplicate votes."
  ].join("\n");
  const url=WEB+"/issues/new?"+new URLSearchParams({
    title:"[Reader vote] #"+story.id+" — "+title,body
  });
  const opened=window.open(url,"_blank","noopener,noreferrer");
  return {url,opened:Boolean(opened)};
}

export async function loadPublicStoryNotes(storyId) {
  const response = await fetch(API + "?state=all&per_page=100",{
    headers:{"Accept":"application/vnd.github+json"}
  });
  if(!response.ok) throw new Error("دریافت حاشیه‌های عمومی ممکن نشد");
  const rows=await response.json();
  return rows.filter(x=>!x.pull_request && /^\[Reader (margin|feedback)\]/.test(x.title||""))
    .map(x=>{
      const body=String(x.body||"");
      const id=/^Story ID:\s*(.+)$/m.exec(body)?.[1]?.trim();
      if(id!==String(storyId))return null;
      const quote=/## Selected passage\s*\n([\s\S]*?)\n\s*## Reader comment/.exec(body)?.[1]?.trim()||"";
      const comment=/## Reader comment\s*\n([\s\S]*?)(?:\n\s*---\s*\n|$)/.exec(body)?.[1]?.trim()||"";
      const rating=/^Rating:\s*(.+)$/m.exec(body)?.[1]?.trim()||"";
      if(!comment)return null;
      return {id:"github-"+x.number,name:String(x.user?.login||"خواننده"),text:comment.slice(0,2500),
        quote:quote==="(general feedback)"?"":quote.slice(0,300),
        time:x.created_at,state:"unchecked",source_url:x.html_url,rating};
    }).filter(Boolean);
}
