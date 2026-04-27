function App() {
  React.useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return React.createElement(React.Fragment, null,
    React.createElement(window.LiquidFilter),
    React.createElement(window.Atmosphere),
    React.createElement(window.LiquidCursor),
    React.createElement(window.Nav),
    React.createElement(window.Hero),
    React.createElement(window.Ticker),
    React.createElement(window.Destinations),
    React.createElement(window.Tours),
    React.createElement(window.IndiaMap),
    React.createElement(window.Quiz),
    React.createElement(window.Reviews),
    React.createElement(window.Guides),
    React.createElement(window.Blog),
    React.createElement(window.Booking),
    React.createElement(window.Footer),
    React.createElement(window.TweaksPanel),
  );
}
window.App = App;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
