const fs = require('fs');
const cheerio = require('cheerio') //for html testing
const inlineCss = require('inline-css'); //for css testing
const cssParser = require('css');
const md5 = require('md5');
const _ = require('lodash'); //for some sanity

//include custom matchers
const styleMatchers = require('jest-style-matchers');
expect.extend(styleMatchers);

const htmlPath = __dirname + '/index.html';
const html = fs.readFileSync(htmlPath, 'utf-8'); //load the HTML file once
const cssPath = __dirname + '/css/style.css';
const css = fs.readFileSync(cssPath, 'utf-8'); //load the HTML file once

//absolute path for relative loading (if needed)
const baseDir = 'file://'+__dirname+'/';

let $, cssMediaRules; //for accessing data

beforeAll(async () => {
  //test CSS by inlining properties and then reading them from cheerio
  let inlined = await inlineCss(html, {extraCss: css, url:baseDir, removeLinkTags:false});
  $ = cheerio.load(inlined);
  // console.log(inlined);
})

//non-inlined rules by parsing AST tree
let cssAST = cssParser.parse(css, {source: cssPath});
cssMediaRules = cssAST.stylesheet.rules.filter((d) => d.type === "media"); //looking for media rules

describe('Source code is valid', () => {
  test('CSS validates without errors', async () => {
    await expect(cssPath).toHaveNoCssLintErrorsAsync();
  })
});

describe('1. HTML supports responsive design', () => {

  test('HTML includes viewport meta', () => {
    let meta = $('meta[name="viewport"]')
    expect(meta.length).toEqual(1); //has the tag

    //width=device-width, initial-scale=1, shrink-to-fit=no
    let metaAttributes = meta.attr('content').split(',').sort();
    expect(metaAttributes[0].trim()).toEqual("initial-scale=1"); //includes attribute
    expect(metaAttributes[1].trim()).toEqual("shrink-to-fit=no"); //includes attribute
    expect(metaAttributes[2].trim()).toEqual("width=device-width"); //includes attribute
  })

  //skipping because unreliable
  // test('HTML is otherwise unchanged', () => {
  //   let body = $.html('body');
  //   let nospace = body.replace(/\s/g, ''); //strip all whitespace to account for platform modifications
  //   //console.log(md5(nospace));
  //   expect(md5(nospace)).toEqual('5c0e77b8ff323f000c079dd94f4927fd');
  // });
});

describe('2. Has appropriate mobile-first "default" styling', () => {

  test('for the overall body', () => {
    let body = $('body')
    expect(body.css('margin')).toEqual('.5rem');
    expect(body.css('background-color').toLowerCase()).toEqual('#93b8d7');
    expect(body.css('color')).toEqual('white');
  })

  test('for the navigation links', () => {
    let navLinks = $('nav a');
    expect(navLinks.css('color')).toEqual('white');
    expect(navLinks.css('font-size')).toEqual('2.5rem');
    expect(navLinks.css('margin-right')).toEqual('.5em');

    expect($('#social-links').css('display')).toEqual('none'); //social links are hidden
  })

  test('for the main content', () => {
    let main = $('main');
    expect(main.css('text-align')).toEqual('center');
    let fontFamilySingleQuotes = (main.css('font-family')).replace(/"/g, '\'');
    expect(fontFamilySingleQuotes).toMatch(/'Kaushan Script', *fantasy/);

    expect(main.css('margin-top')).toEqual('23vh');

    expect(main.children('h1').css('font-size')).toEqual('4rem');
    expect(main.children('h2').css('font-size')).toEqual('2rem');
    expect(main.children('h2').css('margin-top')).toEqual('2em');
  })

  test('for the footer (hidden)', () => {
    expect($('footer').css('display')).toEqual('none');
  })
})

describe('3. Has appropriate styling on screens 598px or larger', () => {

  let smMediaQuery = cssMediaRules.filter((r) => r.media.replace(/\s/g,'').includes('min-width:598px'));
  if(smMediaQuery.length > 0 && smMediaQuery[0].rules) { //ignore comments if there are any
    smMediaQuery[0].rules = smMediaQuery[0].rules.filter((r) => r.type != "comment")
  }
  
  test('using media queries', () => {
    expect(smMediaQuery.length).toBe(1); //one has media query for size
    
    expect(smMediaQuery[0].media).not.toMatch(/and/); //only one condition for size
    expect(smMediaQuery[0].rules.length).toEqual(2); //has two rules inside
  })

  test('for icon links', () => {
    let smRules = smMediaQuery[0].rules;

    let hamburgerIdRule = _.find(smRules, (r) => r.selectors.join().includes('#hamburger-menu'));
    expect(hamburgerIdRule).toBeDefined(); //selects hamburger-menu by id
    let displayProp = _.find(hamburgerIdRule.declarations, ['property', 'display']);
    expect(displayProp).toBeDefined() //has 'display' as property
    expect(displayProp.value).toEqual('none'); //has display:none

    let socialIdRule = _.find(smRules, (r) => r.selectors.join().includes('#social-links'));
    expect(socialIdRule).toBeDefined(); //selects social-links by id
    displayProp = _.find(socialIdRule.declarations, ['property', 'display']);
    expect(displayProp).toBeDefined() //has 'display' as property
    expect(displayProp.value).toEqual('block'); //has display:block
  })
})

describe('4. Has appropriate styling on screens 768px or larger', () => {

  let mdMediaQuery = cssMediaRules.filter((r) => r.media.replace(/\s/g,'').includes('min-width:768px'));
  if(mdMediaQuery.length > 0 && mdMediaQuery[0].rules) { //ignore comments if there are any
    mdMediaQuery[0].rules = mdMediaQuery[0].rules.filter((r) => r.type != "comment")
  }

  test('using media queries', () => {
    expect(mdMediaQuery.length).toBe(1); //one has media query for size    
    expect(mdMediaQuery[0].media).not.toMatch(/and/); //only one condition for size
    expect(mdMediaQuery[0].rules.length).toEqual(4); //has four rules inside
  })

  test('for the background image', () => {
    let mdRules = mdMediaQuery[0].rules;

    let bodyRules = mdRules.filter((r) => r.selectors.join().includes('body'));
    let bodyProperties = bodyRules[0].declarations
                        .filter((r) => r.property.includes('background'))
                        .map((r) => r.value)
                        .join(' ');
    expect(bodyProperties).toMatch("url('../img/splash-md.jpg')"); //background has url. Use single quotes!
    expect(bodyProperties).toMatch("center"); //background is centered
    expect(bodyProperties).toMatch("cover"); //background covers

    let htmlRule = _.find(mdRules, (r) => r.selectors.join().includes('html'));
    let heightProp = _.find(htmlRule.declarations, ['property', 'height']);
    expect(heightProp).toBeDefined() //has 'height' as property
    expect(heightProp.value).toEqual('100%'); //has height:100%
  })

  test('for the footer (displayed)', () => {
    let mdRules = mdMediaQuery[0].rules;
    let footerRule = _.find(mdRules, (r) => r.selectors.join().includes('footer'));

    let targetProps = {
      display: 'block',
      position: 'fixed',
      bottom: '0',
      right: '0',  
    }

    footerProps = footerRule.declarations.map((d) => d.property+':'+d.value); //as array
    for(const prop in targetProps) {
      expect(footerProps).toContain(prop+':'+targetProps[prop]); //contains desired property
    }

    ////alternate version (less readable output)
    // for(const prop in targetProps) {
    //   let cssProperty = _.find(footerRule.declarations, {property: prop})
    //   expect(cssProperty.value).toEqual(targetProps[prop]); //contains desired property
    // }
  })

  test('for the text shadow', () => {
    let mdRules = mdMediaQuery[0].rules;
    let mainRule = _.find(mdRules, (r) => r.selectors.join().includes('main'));
    let textShadowProp = _.find(mainRule.declarations, ['property', 'text-shadow']);
    expect(textShadowProp).toBeDefined() //has 'text-shadow' as property
    expect(textShadowProp.value.toLowerCase()).toEqual('1px 1px #153c43'); //has correct shadow
  })
})

describe('5. Has appropriate styling on screens 992px or larger', () => {

  let lgMediaQuery = cssMediaRules.filter((r) => r.media.replace(/\s/g,'').includes('min-width:992px'));
  if(lgMediaQuery.length > 0 && lgMediaQuery[0].rules) { //ignore comments if there are any
    lgMediaQuery[0].rules = lgMediaQuery[0].rules.filter((r) => r.type != "comment")
  }

  test('using media queries', () => {
    expect(lgMediaQuery.length).toBe(1); //one has media query for size
    
    expect(lgMediaQuery[0].media).not.toMatch(/and/); //only one condition for size
    expect(lgMediaQuery[0].rules.length).toEqual(4); //has four rules inside
  })

  test('for the background image', () => {
    let lgRules = lgMediaQuery[0].rules;

    let bodyRule = _.find(lgRules, (r) => r.selectors.join().includes('body'));
    let backgroundImageProp = _.find(bodyRule.declarations, ['property', 'background-image']);
    expect(backgroundImageProp).toBeDefined() //has 'background-image' as property
    expect(backgroundImageProp.value).toEqual("url('../img/splash-lg.jpg')"); //has correct image. Use single quotes!
  })

  test('for the nav links', () => {
    let lgRules = lgMediaQuery[0].rules;

    let navLinkRule = _.find(lgRules, (r) => r.selectors.join().match('nav .*a'));
    expect(navLinkRule).toBeDefined(); //style <a> inside <nav> for most flexible results
    let fontSizeProp = _.find(navLinkRule.declarations, ['property', 'font-size']);
    expect(fontSizeProp).toBeDefined() //has 'font-size' as property
    expect(fontSizeProp.value).toEqual('1.5rem'); //has correct size
  })

  test('for the text content', () => {
    let lgRules = lgMediaQuery[0].rules;

    let h1Rule = _.find(lgRules, (r) => r.selectors.join().includes('h1'));
    let fontSizeProp = _.find(h1Rule.declarations, ['property', 'font-size']);
    expect(fontSizeProp).toBeDefined() //has 'font-size' as property
    expect(fontSizeProp.value).toEqual('5rem'); //has correct size

    let h2Rule = _.find(lgRules, (r) => r.selectors.join().includes('h2'));
    fontSizeProp = _.find(h2Rule.declarations, ['property', 'font-size']);
    expect(fontSizeProp).toBeDefined() //has 'font-size' as property
    expect(fontSizeProp.value).toEqual('3rem'); //has correct suze
  })
})

describe('6. Has appropriate styling on screens 1200px or larger', () => {

  let xlMediaQuery = cssMediaRules.filter((r) => r.media.replace(/\s/g,'').includes('min-width:1200px'));
  if(xlMediaQuery.length > 0 && xlMediaQuery[0].rules) { //ignore comments if there are any
    xlMediaQuery[0].rules = xlMediaQuery[0].rules.filter((r) => r.type != "comment")
  }

  test('using media queries', () => {
    expect(xlMediaQuery.length).toBe(1); //one has media query for size
    
    expect(xlMediaQuery[0].media).not.toMatch(/and/); //only one condition for size
    expect(xlMediaQuery[0].rules.length).toEqual(1); //has one rule inside
  })

  test('for the background image', () => {
    let xlRules = xlMediaQuery[0].rules;

    let bodyRule = _.find(xlRules, (r) => r.selectors.join().includes('body'));
    let backgroundImageProp = _.find(bodyRule.declarations, ['property', 'background-image']);
    expect(backgroundImageProp).toBeDefined() //has 'background-image' as property
    expect(backgroundImageProp.value).toMatch("url('../img/splash-xl.jpg')"); //has correct image. Use single quotes!
  })
})