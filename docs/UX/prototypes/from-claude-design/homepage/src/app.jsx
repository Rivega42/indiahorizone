function App() {
  React.useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const W = window;
  return (
    <>
      <W.LiquidFilter />
      <W.Atmosphere />
      <W.LiquidCursor />
      <W.Nav />
      <W.Hero />
      <W.Ticker />
      <W.Destinations />
      <W.Tours />
      <W.IndiaMap />
      <W.Quiz />
      <W.Reviews />
      <W.VideoReview />
      <W.ForWhom />
      <W.TrustedBy />
      <W.Guides />
      <W.Blog />
      <W.FAQ />
      <W.Booking />
      <W.Footer />
      <W.TweaksPanel />
    </>
  );
}

window.App = App;
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
