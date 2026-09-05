const userCredentialsTemplate = (username, password) => {
    return `<!DOCTYPE html>
    <html>
        <body>
          <div id="v1signature">
            <p>Cher.e participant.e,</p>
            <p>
                Nous sommes ravis de vous compter parmi les utilisateurs de la plateforme XGOL. Voici vos identifiants pour vous connecter :
            </p>
            <p style="padding-left: 40px;">Login : <strong>${username}</strong></p>
            <p style="padding-left: 40px;">Mot de passe : <strong>${password}</strong></p>
            <p>
                Lors de votre première connexion, vous aurez la possibilité de choisir un coach qui vous accompagnera tout au long de votre parcours.
            </p>
            <p>Quelques consignes importantes :</p>
            <p style="padding-left: 40px;">1. Les vidéos que vous soumettrez ne doivent pas dépasser 2 minutes 30.</p>
            <p style="padding-left: 40px;">2. Assurez-vous de disposer d’un réseau internet de bonne qualité pour garantir une expérience optimale.</p>
            <p style="padding-left: 40px;">3. Il est impératif d’utiliser un ordinateur pour accéder à la plateforme et réaliser vos activités.</p>
            <p>
                Veuillez trouver ci-après une vidéo tutorielle pour mieux comprendre comment naviguer sur la plateforme : 
                <a href="https://youtu.be/yUy9C8sMvvI?si=m_jz8lscQKJ4q2mZ" target="_blank">https://youtu.be/yUy9C8sMvvI?si=m_jz8lscQKJ4q2mZ</a>
            </p>
            <p>
                Pour toute question ou assistance, n’hésitez pas à nous contacter à <a href="mailto:iheb.j@xgol.pro">iheb.j@xgol.pro</a>
            </p>
            <p>Nous vous souhaitons une excellente expérience avec XGOL !</p>
            <p>Cordialement,</p>
            <p>L’équipe XGOL</p>
            <br>
            <img src="https://xgolstorage.blob.core.windows.net/importantfiles/63317e92.png" width="300" height="200" alt="XGOL Logo">
          </div>
        </body>
    </html>`;
};

module.exports = {
    userCredentialsTemplate,
};
