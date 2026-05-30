'use client';
import Link from 'next/link';

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <Link href="/" className="text-green-600 hover:underline text-sm">← Retour à l'accueil</Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : Mai 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900">1. Objet</h2>
            <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme AgriB2B, accessible à l'adresse agri-b2-b-entreprise.vercel.app. AgriB2B est une plateforme de mise en relation entre producteurs agricoles, acheteurs professionnels et transporteurs.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">2. Rôle de la plateforme</h2>
            <p>AgriB2B agit exclusivement en tant qu'intermédiaire de mise en relation. La plateforme :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Facilite la connexion entre vendeurs, acheteurs et transporteurs</li>
              <li>Fournit un système de paiement sécurisé (escrow)</li>
              <li>Propose un suivi de livraison</li>
              <li>Prélève une commission sur les transactions effectuées</li>
            </ul>
            <p className="font-semibold text-gray-900 mt-3">AgriB2B n'est en aucun cas responsable de :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>La qualité, la quantité ou la conformité des produits vendus</li>
              <li>Les délais de livraison effectifs</li>
              <li>Les litiges commerciaux entre utilisateurs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">3. Gestion des stocks — Caractère déclaratif</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-3">
              <p className="font-semibold text-amber-800">⚠️ IMPORTANT</p>
              <p className="text-amber-900 mt-1">La gestion des stocks sur AgriB2B est purement <strong>déclarative</strong>. Les quantités affichées sont renseignées par les vendeurs eux-mêmes et ne font l'objet d'aucune vérification par la plateforme.</p>
            </div>
            <p>En conséquence :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>AgriB2B ne garantit pas la disponibilité réelle des produits affichés</li>
              <li>AgriB2B ne contrôle pas l'exactitude des stocks déclarés par les vendeurs</li>
              <li>AgriB2B n'est pas responsable en cas de rupture de stock après commande</li>
              <li>Le vendeur est seul responsable de la mise à jour de ses stocks</li>
              <li>En cas de stock insuffisant après commande, le vendeur doit annuler la commande et l'acheteur sera remboursé via le système d'escrow</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">4. Inscription et compte utilisateur</h2>
            <p>L'utilisateur s'engage à :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Fournir des informations exactes et à jour lors de l'inscription</li>
              <li>Maintenir la confidentialité de ses identifiants de connexion</li>
              <li>Ne pas créer plusieurs comptes</li>
              <li>Ne pas usurper l'identité d'un tiers</li>
            </ul>
            <p className="mt-2">AgriB2B se réserve le droit de suspendre ou supprimer tout compte en cas de non-respect des présentes CGU.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">5. Commissions et paiements</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Commission vendeurs particuliers : 5% du montant de la transaction</li>
              <li>Commission vendeurs entreprises : 10% du montant de la transaction</li>
              <li>Commission transport : 3% incluse dans le prix affiché</li>
            </ul>
            <p className="mt-2">Les commissions sont prélevées automatiquement lors de la libération du paiement (après confirmation de livraison).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">6. Système d'escrow (séquestre)</h2>
            <p>Le paiement de l'acheteur est bloqué dans un escrow jusqu'à confirmation de la livraison :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>L'acheteur paie → l'argent est bloqué</li>
              <li>Le vendeur expédie → l'acheteur confirme la réception</li>
              <li>L'argent est libéré au vendeur (moins la commission)</li>
              <li>En cas d'annulation, l'acheteur est remboursé intégralement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">7. Interdictions</h2>
            <p>Il est strictement interdit de :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Échanger des coordonnées personnelles via la messagerie (numéros de téléphone, emails, liens vers réseaux sociaux)</li>
              <li>Contourner le système de paiement de la plateforme</li>
              <li>Publier des informations fausses ou trompeuses sur les produits</li>
              <li>Utiliser la plateforme à des fins illégales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">8. Responsabilité</h2>
            <p>AgriB2B met tout en œuvre pour assurer le bon fonctionnement de la plateforme mais ne peut être tenu responsable :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Des interruptions de service (maintenance, pannes techniques)</li>
              <li>Des pertes de données</li>
              <li>Des dommages résultant de l'utilisation de la plateforme</li>
              <li>Des transactions entre utilisateurs</li>
              <li>De la véracité des informations publiées par les utilisateurs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">9. Protection des données</h2>
            <p>AgriB2B collecte et traite les données personnelles des utilisateurs dans le respect de la réglementation en vigueur. Les données sont utilisées uniquement pour le fonctionnement de la plateforme et ne sont pas revendues à des tiers.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">10. Suppression de compte</h2>
            <p>L'utilisateur peut à tout moment demander la suppression de son compte. L'administrateur peut également supprimer un compte en cas de violation des CGU. La suppression entraîne la perte de toutes les données associées.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">11. Modification des CGU</h2>
            <p>AgriB2B se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle. L'utilisation continue de la plateforme après modification vaut acceptation des nouvelles CGU.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">12. Contact</h2>
            <p>Pour toute question relative aux présentes CGU :</p>
            <p className="font-medium">Email : contact.agrib2b@gmail.com</p>
          </section>

        </div>

        <div className="mt-8 pt-6 border-t text-center">
          <Link href="/register" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            Retour à l'inscription
          </Link>
        </div>
      </div>
    </div>
  );
}
