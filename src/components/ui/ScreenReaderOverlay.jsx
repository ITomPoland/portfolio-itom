import { useScene } from '../../context/SceneContext';
import '../../styles/ScreenReaderOverlay.scss';

/**
 * ScreenReaderOverlay — A7 Accessibility
 * 
 * Invisible HTML layer providing screen reader access to 3D canvas content.
 * Contains buttons/links matching interactive 3D elements (doors, rooms).
 * Visually hidden via .sr-only but fully accessible to assistive tech.
 */
const ScreenReaderOverlay = () => {
    const { hasEntered, isInRoom, currentRoom, teleportTo, requestExit } = useScene();

    return (
        <div className="sr-overlay" role="complementary" aria-label="Navigation accessible du site 3D">
            {/* Skip to content link */}
            <a href="#sr-main-nav" className="sr-only sr-focusable">
                Aller à la navigation accessible
            </a>

            {/* Main accessible navigation */}
            <nav id="sr-main-nav" className="sr-only" aria-label="Espaces du site">
                <h1>Hakkilo XR — Studio de réalité étendue</h1>
                <h2>Navigation du site</h2>

                {!hasEntered && (
                    <p>Bienvenue sur le site 3D interactif de Hakkilo XR. Cliquez sur une porte ou appuyez sur Entrée pour entrer.</p>
                )}

                {hasEntered && !isInRoom && (
                    <>
                        <p>Vous explorez le campus. Choisissez un espace à visiter :</p>
                        <ul>
                            <li>
                                <button onClick={() => teleportTo('about')} type="button">
                                    Présentation — Notre équipe, notre démarche et notre vision
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('gallery')} type="button">
                                    La Galerie — Nos projets et réalisations
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('contact')} type="button">
                                    Contact — Écrivez-nous
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('studio')} type="button">
                                    Le Studio — Boutique et exposition de nos produits
                                </button>
                            </li>
                        </ul>
                    </>
                )}

                {hasEntered && isInRoom && (
                    <>
                        <p>
                            Vous êtes dans l'espace {currentRoom === 'about' ? 'Présentation' :
                                currentRoom === 'gallery' ? 'Galerie' :
                                    currentRoom === 'contact' ? 'Contact' :
                                        currentRoom === 'studio' ? 'Studio' : currentRoom}.
                        </p>
                        <button onClick={requestExit} type="button">
                            Revenir à l'extérieur
                        </button>

                        {/* Room-specific content descriptions */}
                        {currentRoom === 'about' && (
                            <div aria-label="Contenu de l'espace Présentation">
                                <h3>Présentation</h3>
                                <p>Cet espace présente Hakkilo XR : notre équipe, notre démarche et notre vision de la réalité étendue au service des entreprises.</p>
                            </div>
                        )}
                        {currentRoom === 'gallery' && (
                            <div aria-label="Contenu de l'espace Galerie">
                                <h3>Nos projets</h3>
                                <p>Parcourez les projets et expériences immersives réalisés par le studio. Cliquez sur un projet pour en voir le détail.</p>
                            </div>
                        )}
                        {currentRoom === 'contact' && (
                            <div aria-label="Contenu de l'espace Contact">
                                <h3>Nous contacter</h3>
                                <p>Envoyez-nous un message via le formulaire de contact : projet, question ou demande de démonstration.</p>
                            </div>
                        )}
                        {currentRoom === 'studio' && (
                            <div aria-label="Contenu de l'espace Studio">
                                <h3>Le Studio — Boutique &amp; Exposition</h3>
                                <p>Découvrez nos produits de réalité étendue exposés en 3D : cliquez sur un produit pour ouvrir sa fiche et demander une démonstration.</p>
                            </div>
                        )}

                        {/* Quick navigation to other rooms */}
                        <h3>Navigation rapide</h3>
                        <ul>
                            {currentRoom !== 'about' && (
                                <li><button onClick={() => teleportTo('about')} type="button">Aller à la Présentation</button></li>
                            )}
                            {currentRoom !== 'gallery' && (
                                <li><button onClick={() => teleportTo('gallery')} type="button">Aller à la Galerie</button></li>
                            )}
                            {currentRoom !== 'contact' && (
                                <li><button onClick={() => teleportTo('contact')} type="button">Aller au Contact</button></li>
                            )}
                            {currentRoom !== 'studio' && (
                                <li><button onClick={() => teleportTo('studio')} type="button">Aller au Studio</button></li>
                            )}
                        </ul>
                    </>
                )}
            </nav>

            {/* Live region for state changes */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {isInRoom && `Espace ${currentRoom === 'about' ? 'Présentation' :
                    currentRoom === 'gallery' ? 'Galerie' :
                        currentRoom === 'contact' ? 'Contact' :
                            currentRoom === 'studio' ? 'Studio' : currentRoom} ouvert`}
            </div>
        </div>
    );
};

export default ScreenReaderOverlay;
