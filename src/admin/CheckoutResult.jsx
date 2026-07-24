import '../styles/AdminApp.scss';

export default function CheckoutResult() {
    const path = window.location.pathname.replace(/\/+$/, '');
    const isSuccess = path.endsWith('/checkout/success');

    return (
        <div className="admin-app admin-app--checkout">
            <div className="admin-card">
                <h1>{isSuccess ? 'Merci pour votre commande' : 'Paiement annulé'}</h1>
                <p>
                    {isSuccess
                        ? 'Votre paiement a été pris en compte. Notre équipe vous contactera si nécessaire.'
                        : 'Aucun débit n’a été effectué. Vous pouvez fermer cette page ou retourner à l’expérience.'}
                </p>
                <a href="/" className="admin-btn admin-btn--primary">Retour au site</a>
            </div>
        </div>
    );
}
