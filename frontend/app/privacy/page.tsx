'use client';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Politique de Confidentialité</h1>
        <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : 3 juin 2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Introduction</h2>
            <p>AgriB2B (exploité par MboaMarket) respecte votre vie privée. Cette politique explique quelles données nous collectons, pourquoi nous les collectons et comment nous les utilisons.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Données collectées</h2>
            <p>Nous collectons les données suivantes lors de votre inscription et utilisation :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Nom, adresse email, numéro de téléphone</li>
              <li>Pays et région</li>
              <li>Type de compte (particulier ou entreprise)</li>
              <li>Documents KYC (pièce d'identité, documents d'entreprise)</li>
              <li>Historique de commandes et transactions</li>
              <li>Messages échangés sur la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Utilisation des données</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Créer et gérer votre compte</li>
              <li>Traiter vos commandes et paiements</li>
              <li>Vérifier votre identité (KYC)</li>
              <li>Vous envoyer des notifications sur vos transactions</li>
              <li>Améliorer nos services</li>
              <li>Assurer la sécurité de la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Partage des données</h2>
            <p>Nous ne vendons jamais vos données personnelles. Vos données peuvent être partagées avec :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Les autres utilisateurs de la plateforme dans le cadre d'une transaction (nom, région)</li>
              <li>Les prestataires de paiement (MTN MoMo, Orange Money) pour traiter vos transactions</li>
              <li>Les autorités compétentes si requis par la loi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Sécurité</h2>
            <p>Nous protégeons vos données avec :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Chiffrement SSL/TLS pour toutes les communications</li>
              <li>Hachage des mots de passe (bcrypt)</li>
              <li>Authentification JWT sécurisée</li>
              <li>Accès restreint aux données personnelles</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Conservation des données</h2>
            <p>Vos données sont conservées tant que votre compte est actif. Vous pouvez demander la suppression de votre compte et de vos données à tout moment.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Vos droits</h2>
            <p>Vous avez le droit de :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Accéder à vos données personnelles</li>
              <li>Rectifier vos données</li>
              <li>Supprimer votre compte</li>
              <li>Retirer votre consentement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Contact</h2>
            <p>Pour toute question concernant cette politique de confidentialité :</p>
            <p className="mt-2 font-medium">Email : contact.mboamarket@gmail.com</p>
            <p className="font-medium">Site : www.mboamarket.africa</p>
          </section>
        </div>
      </div>
    </div>
  );
}
