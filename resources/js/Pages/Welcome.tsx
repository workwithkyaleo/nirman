import { useEffect } from "react";
import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import "../../css/marketing.css";

const Arrow = () => <span aria-hidden="true">→</span>;

export default function Welcome({ auth, brand }: PageProps) {
    const primaryHref = auth.user ? route("dashboard") : route("register");
    const productName = brand?.name || "SiteSajilo";

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (mediaQuery.matches) {
            return;
        }

        const parallaxElements = Array.from(
            document.querySelectorAll<HTMLElement>("[data-parallax-speed]"),
        );
        let frame = 0;

        const updateParallax = () => {
            frame = 0;
            const viewportCenter = window.innerHeight / 2;

            parallaxElements.forEach((element) => {
                const speed = Number(element.dataset.parallaxSpeed);
                const bounds = element.getBoundingClientRect();
                const offset = (viewportCenter - (bounds.top + bounds.height / 2)) * speed;
                element.style.setProperty("--ss-parallax-y", `${offset.toFixed(2)}px`);
            });
        };

        const requestUpdate = () => {
            if (!frame) {
                frame = window.requestAnimationFrame(updateParallax);
            }
        };

        updateParallax();
        window.addEventListener("scroll", requestUpdate, { passive: true });
        window.addEventListener("resize", requestUpdate);

        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("scroll", requestUpdate);
            window.removeEventListener("resize", requestUpdate);
        };
    }, []);

    return (
        <>
            <Head title={`${productName} — Create a website that means business`}>
                <meta name="description" content="Create, manage and grow your business online with SiteSajilo." />
            </Head>
            <div className="ss-marketing">
                <a className="ss-skip" href="#main">Skip to content</a>
                <header className="ss-header">
                    <a href="/" className="ss-logo" aria-label={`${productName} home`}><span className="ss-logo-mark">S</span>{productName}</a>
                    <nav className="ss-nav" aria-label="Main navigation">
                        <a href="#create">Create</a><a href="#solutions">Business</a><a href="#templates">Templates</a><a href="#features">Resources</a>
                    </nav>
                    <div className="ss-header-actions">
                        {!auth.user && <Link className="ss-login" href={route("login")}>Log in</Link>}
                        <Link className="ss-button ss-button-small" href={primaryHref}>Get Started</Link>
                    </div>
                </header>

                <main id="main">
                    <section className="ss-hero" id="create">
                        <p className="ss-kicker">THE WEBSITE BUILDER FOR AMBITIOUS IDEAS</p>
                        <h1>Create your future<br />on your own terms.</h1>
                        <p className="ss-hero-copy">Build a beautiful website, run your store and grow your business—all from one powerful place.</p>
                        <Link className="ss-button ss-button-hero" href={primaryHref}>Start Creating <Arrow /></Link>
                        <p className="ss-fineprint">Start free. No credit card required.</p>
                        <div className="ss-stage" data-parallax-speed="-0.035" aria-label="A visual preview of the SiteSajilo website builder">
                            <div className="ss-toolbar"><span className="ss-mini-logo">LUMA</span><span>Pages</span><span>Design</span><span>Store</span><span className="ss-toolbar-grow" /><span>↶</span><span>↷</span><button>Publish</button></div>
                            <aside className="ss-tools"><span>＋</span><span>◫</span><span>◉</span><span>☷</span><span>♧</span></aside>
                            <div className="ss-canvas" data-parallax-speed="0.02">
                                <div className="ss-site-nav"><b>Luma Objects</b><span>Shop&nbsp;&nbsp; Story&nbsp;&nbsp; Journal&nbsp;&nbsp; Cart (0)</span></div>
                                <div className="ss-site-hero"><p>OBJECTS FOR A SLOWER HOME</p><h2>Made for<br /><em>everyday rituals.</em></h2><a>Shop collection <Arrow /></a><div className="ss-orb one" data-parallax-speed="0.09" /><div className="ss-orb two" data-parallax-speed="-0.07" /><div className="ss-vase" data-parallax-speed="0.12"><i /></div></div>
                            </div>
                            <div className="ss-panel" data-parallax-speed="-0.1"><small>AI SITE ASSISTANT</small><strong>What would you like to create?</strong><div className="ss-input">Add a section for my story <b>↑</b></div></div>
                            <div className="ss-selection" data-parallax-speed="0.08"><b>Heading</b><span>✦</span><span>B</span><span>↗</span></div>
                            <div className="ss-sticker" data-parallax-speed="-0.13">Designed<br />by you <b>✦</b></div>
                        </div>
                    </section>

                    <section className="ss-proof"><p>ONE PLATFORM. EVERY POSSIBILITY.</p><div><span><b>Sites</b> built with ease</span><span><b>Store</b> ready from day one</span><span><b>Tools</b> that grow with you</span></div></section>
                    <section className="ss-intro" id="solutions"><p className="ss-kicker">MADE TO MOVE YOUR BUSINESS FORWARD</p><h2>Everything you need<br />to bring your vision to life.</h2><p>From your first page to your first sale, SiteSajilo gives you the creative freedom and built-in business tools to make every move count.</p></section>

                    <section className="ss-solution-grid" id="templates">
                        <article className="ss-solution ss-store"><div className="ss-card-art"><div className="ss-product-card"><i>NEW<br />ARRIVAL</i><b>Studio<br />essentials</b><span>Explore now →</span></div></div><p>SELL ONLINE</p><h3>Everything for your store</h3><span>Products, inventory, checkout and orders—beautifully connected.</span><a href={primaryHref}>Build your store <Arrow /></a></article>
                        <article className="ss-solution ss-design"><div className="ss-card-art"><div className="ss-type-card"><b>Make it<br /><em>yours.</em></b><span>TYPE &nbsp; COLOR &nbsp; MOTION</span></div></div><p>DESIGN FREELY</p><h3>Start with a spark</h3><span>Choose a polished template, then personalize every detail.</span><a href={primaryHref}>Explore templates <Arrow /></a></article>
                        <article className="ss-solution ss-grow"><div className="ss-card-art"><div className="ss-chart"><span>Sales this month</span><b>Rs. 84,200</b><i>↗ 24%</i><svg viewBox="0 0 300 85"><path d="M0 72 C35 59 45 66 78 49 S115 58 142 34 S181 48 205 28 S250 35 300 4" /></svg></div></div><p>GROW WITH CLARITY</p><h3>Know what’s working</h3><span>Make smarter decisions with your sales and customer activity in one view.</span><a href={primaryHref}>See your dashboard <Arrow /></a></article>
                    </section>

                    <section className="ss-edit" id="features"><div className="ss-edit-copy"><p className="ss-kicker">YOUR VISION, IN MOTION</p><h2>Make every pixel feel like you.</h2><p>Start with AI or a template. Then edit directly on the page with simple controls that give you room to experiment.</p><Link className="ss-text-link" href={primaryHref}>Start designing <Arrow /></Link></div><div className="ss-edit-demo"><div className="ss-edit-sidebar"><span>＋</span><span>▣</span><span>◈</span><span>☷</span></div><div className="ss-edit-page"><p>THE ART OF THE GATHERING</p><h3>Stories worth<br /><em>staying for.</em></h3><div className="ss-cursor">↖<small>Drag to move</small></div></div><div className="ss-color-pop"><small>COLOR THEME</small><div><i /><i /><i /><i /></div><b>Warm studio</b></div></div></section>
                    <section className="ss-bottom-cta"><p className="ss-kicker">YOUR NEXT MOVE STARTS HERE</p><h2>Ready when<br />you are.</h2><Link className="ss-button ss-button-hero" href={primaryHref}>Get Started <Arrow /></Link><p className="ss-fineprint">It’s free to start. Make it yours.</p></section>
                </main>
                <footer className="ss-footer"><a className="ss-logo" href="/"><span className="ss-logo-mark">S</span>{productName}</a><span>© {new Date().getFullYear()} {productName}</span><span>Built for the next big thing.</span></footer>
            </div>
        </>
    );
}
