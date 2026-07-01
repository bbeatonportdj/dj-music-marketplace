import '../styles/featured-artists.css';

const MOCK_ARTISTS = [
  { id: 1, name: "UGEEZY EDITS", genre: "Top 40 / Hip Hop", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&h=200&fit=crop", followers: "12.5K" },
  { id: 2, name: "DISCO DAN", genre: "House / Tech", image: "https://images.unsplash.com/photo-1459749411177-042180ce673c?w=200&h=200&fit=crop", followers: "8.2K" },
  { id: 3, name: "AJ REMIX", genre: "Thai Dance / EDM", image: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=200&h=200&fit=crop", followers: "25.1K" },
  { id: 4, name: "METRO BEATS", genre: "Trap / Soul", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop", followers: "15.7K" },
];

const FeaturedArtists = () => {
  return (
    <section className="featured-artists">
      <div className="section-header">
        <h2>Featured Artists</h2>
        <button className="view-all-btn">View All</button>
      </div>
      
      <div className="artists-grid">
        {MOCK_ARTISTS.map((artist) => (
          <div key={artist.id} className="artist-card">
            <div className="artist-image">
              <img src={artist.image} alt={artist.name} />
            </div>
            <div className="artist-info">
              <h3>{artist.name}</h3>
              <p className="artist-genre">{artist.genre}</p>
              <div className="artist-meta">
                <span className="follower-count">{artist.followers} Followers</span>
                <button className="follow-btn">Follow</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedArtists;
