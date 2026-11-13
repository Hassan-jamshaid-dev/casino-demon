type PreviewKind = 'win' | 'loss' | 'vip-win' | 'bonus';

type PreviewRowProps = {
  onPreview: (kind: PreviewKind) => void;
};

export function PreviewRow({ onPreview }: PreviewRowProps) {
  return (
    <section className="dev-preview" aria-labelledby="preview-heading">
      <h2 id="preview-heading" className="dev-kicker">
        PREVIEW
      </h2>
      <div className="dev-preview-row">
        <button type="button" className="dev-btn" data-testid="preview-win" onClick={() => onPreview('win')}>
          WIN
        </button>
        <button
          type="button"
          className="dev-btn"
          data-testid="preview-loss"
          onClick={() => onPreview('loss')}
        >
          LOSS
        </button>
        <button
          type="button"
          className="dev-btn"
          data-testid="preview-vip"
          onClick={() => onPreview('vip-win')}
        >
          VIP WIN
        </button>
        <button
          type="button"
          className="dev-btn"
          data-testid="preview-bonus"
          onClick={() => onPreview('bonus')}
        >
          BONUS
        </button>
      </div>
      <p className="dev-help">Previews do not change the balance.</p>
    </section>
  );
}
