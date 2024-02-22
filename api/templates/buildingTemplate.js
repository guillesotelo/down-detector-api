const { downLogoBase64 } = require("./down-logo-base64")

const htmlBuildingTemplate = `
<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #efefef;">
    <div style="background-color: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1); text-align:center">
        <img src=${downLogoBase64} alt='{process.env.APP_NAME} Logo' style="height: 3rem; width: auto; margin: .5rem" loading="lazy"/>
        <h2 style="font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: #333;">Building site...</h2>
        <p style="font-family: Arial, sans-serif; font-size: 16px; color: #666;">You will be redirected after <span id="countdown">30</span> seconds. Please wait.</p>
    </div>
</div>
<script>
    let countdownValue = 30;
    function updateCountdown() {
        countdownValue--;
        document.getElementById('countdown').innerText = countdownValue;
        if (countdownValue <= 0) window.location.reload();
        else  setTimeout(updateCountdown, 1000);
        
    }
    updateCountdown();
</script>
`

module.exports = { htmlBuildingTemplate }