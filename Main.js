const { Builder, By, Key, until } = require('selenium-webdriver');
const Chrome = require('selenium-webdriver/chrome');
const Options = new Chrome.Options();

Options.headless();

const List = { // element lists.
    "Link":"https://m.cultureland.co.kr/mmb/loginMain.do",
    "LoginNameId":"txtUserId",
    "passwd":"passwd",
    "loginBtn":"btnLogin",
    "0":"txtScr11",
    "1":"txtScr12",
    "2":"txtScr13",
    "3":"txtScr14",
    "submit":"btnCshFrom"
};

const spdict = {
    "": "어금기호",
    "~": "물결표시",
    "!": "느낌표",
    "@": "골뱅이",
    "#": "샾",
    "$": "달러기호",
    "%": "퍼센트",
    "^": "꺽쇠",
    "&": "엠퍼샌드",
    "*": "별표",
    "(": "왼쪽괄호",
    ")": "오른쪽괄호",
    "-": "빼기",
    "_": "밑줄",
    "=": "등호",
    "+": "더하기",
    "[": "왼쪽대괄호",
    "{": "왼쪽중괄호",
    "]": "오른쪽대괄호",
    "}": "오른쪽중괄호",
    "\\": "역슬래시",
    "|": "수직막대",
    ";": "세미콜론",
    ":": "콜론",
    "/": "슬래시",
    "?": "물음표",
    ",": "쉼표",
    "<": "왼쪽꺽쇠괄호",
    ".": "마침표",
    ">": "오른쪽꺽쇠괄호",
    "'": "작은따옴표",
    '"': "따옴표",
}

class cultureAutoCharger {

    /**
     * 
     * @param {String} name 
     * @param {String} password 
     */

    constructor(name,password) {

        var self = this;
        
        (async function() {

            var Driver = await new Builder().forBrowser("chrome").setChromeOptions(Options).build();
            self.Driver = Driver;
            
            // login to cultureland.

            await Driver.get(List.Link);
            Driver.findElement(By.id(List.LoginNameId)).click();
            Driver.findElement(By.id(List.LoginNameId)).sendKeys(name);
            await Driver.findElement(By.id(List.passwd)).click();

            // writing password
            for (var i=0;i<password.length;i++) {
                var key = password.charAt(i);

                if (spdict[key]) {
                    await self.toSpecialstring();
                    await self.simuClick(spdict[key]);
                    await self.toSpecialstring();
                } else if (self.isUppercase(key) && !spdict[key] && isNaN(key)) {
                    await self.toUppercase();
                    await self.simuClick(key);
                    await self.toUppercase();
                } else {
                    await self.simuClick(key);
                }

            }

            await self.simuClick("입력완료");
            await Driver.findElement(By.id(List.loginBtn)).click();

            await Driver.get("https://m.cultureland.co.kr/csh/cshGiftCard.do");

            // to prevent error caused by delay
            setTimeout(function() {
                Driver.getCurrentUrl().then(function(url) {

                    if (url != "https://m.cultureland.co.kr/csh/cshGiftCard.do") {
                        console.error("Failed to login cultureland. Please restart process.");
                        return;
                    }

                })
            },1000)

        })()

    }

    /**
     * 
     * @param {String} char 
     */
    isUppercase(char) {
        return char === char.toUpperCase();
    }

    async toUppercase() {
        await this.Driver.executeScript("mtk.cap(event,this)");
    }

    async toSpecialstring() {
        await this.Driver.executeScript("mtk.sp(event,this)");
    }

    async simuClick(key) {
        try {
            await this.Driver.findElement(By.css(`[alt="${key}"]`)).click()
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * 
     * @param {String} code 
     */

    checkCodeform(code) {
        if (code) {
            var sp = code.split("-");

            if (sp.length != 4) {
                return false;
            }

            for (var i=0;i<sp.length;i++) {
                if (i <= 2 && sp[i].length != 4) {
                    return false;
                } else if (i == 3 && !(sp[i].length == 4 || sp[i].length == 6)) {
                    return false;
                }
            }

            return sp;

        }
    }

    /**
     * 
     * @param {String} code 
     */

    async Charge(code,callback) {
        var tick = new Date().getTime();

        var result = this.checkCodeform(code);
        var self = this;

        if (result != false) {

            result.forEach(async (code,index) => {
                if (index != 3) {
                    await self.Driver.findElement(By.id(List[index])).sendKeys(code);
                } else {

                    for (var idx=0;idx<code.length;idx++) {
                        var key = code.charAt(idx);
                        await self.simuClick(key);
                    }
                    
                }
            })

            setTimeout(async function() {

                await self.simuClick("입력완료");

                try {
                    await self.Driver.findElement(By.id(List.submit)).click();

                    var result = {};

                    result["balance"] = await self.Driver.findElement(By.xpath("/html/body/div/div[3]/section/dl/dd")).getText();
                    result["status"] = await self.Driver.executeScript(`return document.querySelector("table>tbody>tr>td>b").innerText`);
                    result["tick"] = new Date().getTime() - tick;
    
                    callback(null,result);
                    await self.Driver.get("https://m.cultureland.co.kr/csh/cshGiftCard.do");


                } catch (error) {
                    callback(error,null);
                    await self.Driver.get("https://m.cultureland.co.kr/csh/cshGiftCard.do");
                }

            },400)

        } else {
            callback("Invalid form of code.",null);
        }
    }

}

module.exports = cultureAutoCharger;