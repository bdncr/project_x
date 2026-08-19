export type StoryBlock = { heading: string; paragraph: string };

type StoryBodyProps = {
  title: string;
  story: StoryBlock[];
  slideChunks: string[][];
};

/** The dark case-study body: alternating uppercase section headers with centered
 * copy, interleaved with edge-to-edge, gapless slide sequences. */
export function StoryBody({ title, story, slideChunks }: StoryBodyProps) {
  return <div className="case-body">
    {story.map((block, index) => <div key={block.heading}>
      <section className="case-story-block">
        <h2>{block.heading}</h2>
        <p>{block.paragraph}</p>
      </section>
      {slideChunks[index] && slideChunks[index].length > 0 && <div className="case-slides">
        {slideChunks[index].map((src) => <img key={src} src={src} alt={title} loading="lazy" />)}
      </div>}
    </div>)}
  </div>;
}
