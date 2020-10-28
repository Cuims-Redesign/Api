const puppeteer = require("puppeteer");
const express = require('express');
const bodyParser = require('body-parser')
const app = express();

const login = async (username, password) => {
  var retcookies = null
  const browser = await puppeteer.launch({ headless: true , args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-accelerated-2d-canvas','--no-first-run','--no-zygote','--single-process','--disable-gpu']});
  const page = await browser.newPage();
  page.viewport(null)
  await page.setRequestInterception(true);
  page.on('request', (req) => {
      if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image' || req.resourceType() == 'script' || req.resourceType() == 'other' ){
          req.abort();
      }
      else {
          req.continue();
      }
  });

  await page.goto("https://uims.cuchd.in/uims/").then(async ()=>{
    console.log("ok")
    await page.type("[name=txtUserId]", username);
    page.click("[type=submit]");
    await page.waitForSelector("[name=txtLoginPassword]",{visible:true});
  
    await page.type("[name=txtLoginPassword]", password);
    page.click("[type=submit]");
    
    await page.waitForResponse(response => response.ok())
  
    retcookies = await page.cookies();
  }).catch(error =>{
    console.log(error)
  })
  
  browser.close();
  
 return retcookies;
}

const attendence = async(reqcookie) =>{
  const browser = await puppeteer.launch({ headless: true , args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-accelerated-2d-canvas','--no-first-run','--no-zygote','--single-process','--disable-gpu']});
  const page = await browser.newPage();
  page.viewport(null)
  await page.setRequestInterception(true);
  page.on('request', (req) => {
      if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image' || req.resourceType() == 'script' || req.resourceType() == 'other' ){
          req.abort();
      }
      else {
          req.continue();
      }
  });
  
  await page.setCookie(...reqcookie);
  const r = await(await page.goto("https://uims.cuchd.in/UIMS/frmStudentCourseWiseAttendanceSummary.aspx")).text();
  browser.close();
  const data = r.slice(r.search('getReport')+10,r.search('getReport')+64).split(',');
  const code = "{UID:'"+data[0].slice(1,data[0].length-1)+"'"+",Session:'"+data[1].slice(1,data[1].length-1)+"'}";
  return code;
}

const userpic = async(reqcookie) =>{
  const browser = await puppeteer.launch({ headless: true , args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-accelerated-2d-canvas','--no-first-run','--no-zygote','--single-process','--disable-gpu']});
  const page = await browser.newPage();
  page.viewport(null)
  await page.setRequestInterception(true);
  page.on('request', (req) => {
      if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font'  || req.resourceType() == 'script' ||req.resourceType() == 'image'|| req.resourceType() == 'other' ){
          req.abort();
      }
      else {
          req.continue();
      }
  });
  await page.setCookie(...reqcookie);
  const r = await (await page.goto("https://uims.cuchd.in/UIMS/frmStudentProfile.aspx")).text();
  const imgbase64 = r.slice(r.search('data:image;base64'),r.search('data:image;base64')+r.slice(r.search('data:image;base64'),r.search('data:image;base64')+5000).search('=')+1);

  return imgbase64;
}

app.use(bodyParser.json());

app.get('/login',async(req,res)=>{
  console.log("Request Recieved");
  const a = await login(req.query.username,req.query.password);
  res.json(a)
});

app.post('/attendence',async(req,res)=>{
  var reqcookie = req.body;
  const code  = await attendence(reqcookie);
  res.json(code)
})

app.post('/userpic',async(req,res)=>{
  const reqcookie = req.body;
  var code  = await userpic(reqcookie);
  code = code.slice(18,code.length);
  res.end(code)
})

app.listen(process.env.PORT || 3000,()=>{
  console.log('Running ...');
})
