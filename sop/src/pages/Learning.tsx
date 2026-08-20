
const videos = [
  { id: "1", title: "Waste Segregation Basics", duration: "4:12", category: "Basics", thumb: "https://placehold.co/400x225" },
  { id: "2", title: "Composting at Home", duration: "7:35", category: "Organic", thumb: "https://placehold.co/400x225" },
  { id: "3", title: "Recycling Plastics Correctly", duration: "5:50", category: "Recycling", thumb: "https://placehold.co/400x225" },
  { id: "4", title: "E-Waste: What to Do", duration: "6:03", category: "Hazardous", thumb: "https://placehold.co/400x225" },
  { id: "5", title: "Community Cleanup Drives", duration: "3:44", category: "Community", thumb: "https://placehold.co/400x225" },
  { id: "6", title: "Reducing Household Waste", duration: "8:20", category: "Basics", thumb: "https://placehold.co/400x225" },
];

export default function Learning() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Learn</h1>
          <p>Short videos on waste management, sorted for you</p>
        </div>
      </div>

      <div className="grid grid-3">
        {videos.map((v) => (
          <a className="card video-card" key={v.id} href="#">
            <div className="video-thumb-wrap">
              <img src={v.thumb} alt={v.title} className="video-thumb" />
              <span className="video-duration">{v.duration}</span>
            </div>
            <div className="video-body">
              <span className="chip">{v.category}</span>
              <h3 className="video-title">{v.title}</h3>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}