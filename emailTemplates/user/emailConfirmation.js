const emailConfirmation = (link,username) => {
    return ` <!DOCTYPE html>
    <html>
        <head>
           <style>
               html, body {
        margin: 0 auto;
        padding: 0;
    }
    
    .layout {
        background-color: #EEEEEE;
        font-family: "Roboto";
        width: 100%;
        color: #484b5b;
        padding: 20px 0;
    }
    
    .content {
        text-align: center;
        background-color: white;
        width: 75%;
        margin: 0 auto;
        padding: 25px;
    }
    
    .name {
        line-height: 20px;
        font-size: 24px;
        
    }
    
    .logo {
        width: 150px;
        margin: 0px auto;
    }
    
    hr {
      border: 0;
      clear:both;
      display:block;
      width: 96%;               
      background-color: #d1d1d1;
      height: 1px;
      margin-top: 20px;
    }
    
    
    .link-container {
      padding: 25px; 
      margin: 0 auto;
    }
    
    .link {
        padding: 18px 30px;
        background-color: #1a64db;
        width: 50%;
        margin: 0 auto;
        border-radius: 50px;
        border: none;
        color: white;
        font-size: 18px;
        text-decoration: none;
        
    }
    
    .address {
        text-align: center
    }
    
    .address p {
        line-height: 7px;
        font-size: 15px
    }
    
    .address h2 {
        font-size: 17px
    }
    
    
    .footer {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        
    }
    
    .footer-logo {
        width: 50px;
        margin: 20px auto;
        display: block
        
    }
    
    @media only screen and (max-width: 600px) {
      content {
        width: 100%;
      }
    
      link {
        width: 100%;
      }
    }
           </style>
        </head>
        
        
        
        <body>
            <div class="layout">
            <div class="content">
                <img src="https://i.postimg.cc/prqJ8ymh/XGOL-LOGO-White-BG-1.png" class="logo" />
                <h1 class="name">XGOL</h1>
                
                  <hr>
                  <div>
                    <p>
                       Dear ${username}, 
                    </p>
                  

                  Welcome to XGOL! You're just one step away from accessing all the features available to you through our platform. 
                  
                  To activate your account and get started, please click the link below: 
                  <p>
                      <a href=${link}  >
                         Verify Your Email
                      </a>
                  </p>
                
                  
                  Thank you for choosing XGOL.  
                  
                  Warm regards, 
                  
                  The XGOL Team 
                  </div>
                  
                
                  
                  
                  
                 
            </div>
            
          <div class"footer">
              <a href="https://xgol.com">
              <img class="footer-logo" src="https://i.postimg.cc/prqJ8ymh/XGOL-LOGO-White-BG-1.png" alt="arc"/>
            </a>
          </div>
       
        </div>
        </body>
    </html>`
    ;
};
module.exports = {
    emailConfirmation
 }

