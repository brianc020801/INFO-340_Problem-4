const fs = require('fs');
const cheerio = require('cheerio') //for html testing

//include custom matchers
const styleMatchers = require('jest-style-matchers');
expect.extend(styleMatchers);

const htmlPath = __dirname + '/index.html';
const html = fs.readFileSync(htmlPath, 'utf-8'); //load the HTML file once

//absolute path for relative loading (if needed)
const baseDir = 'file://'+__dirname+'/';

let $ = cheerio.load(html) //for accessing data

describe('Source code is valid', () => {
  test('HTML validates without errors', async () => {
    const lintOpts = {
      'attr-bans':['align', 'background', 'bgcolor', 'border', 'frameborder', 'marginwidth', 'marginheight', 'scrolling', 'style', 'width', 'height'], //adding height, allow longdesc
      'doctype-first':true,
      'doctype-html5':true,
      'html-req-lang':true,
      'attr-name-style': false, //for meta tags
      'line-end-style':false, //either way
      'indent-style':false, //can mix/match
      'indent-width':false, //don't need to beautify
      'line-no-trailing-whitespace': false, //don't need to beautify
      'class-style':'none', //I like dashes in classnames
      'img-req-alt':false, //for this test; captured later!
    }

    await expect(htmlPath).toHaveNoHtmlLintErrorsAsync(lintOpts);
  })
});

describe('1. Page utilizes the Bootstrap CSS framework', () => {

  test('HTML links (only) the Bootstrap stylesheet', () => {
    let links = $('link');
    expect(links.length).toBe(1); //only links to one CSS file
    expect(links.attr('href')).toMatch(/bootstrap@5.*bootstrap\.(min\.)?css$/); //links to bootstrap 5
  });

  test('HTML includes viewport meta', () => {
    let meta = $('meta[name="viewport"]')
    expect(meta.length).toEqual(1); //has the tag

    //width=device-width, initial-scale=1, shrink-to-fit=no
    let metaAttributes = meta.attr('content').split(',').sort();
    expect(metaAttributes[0].trim()).toEqual("initial-scale=1"); //includes attribute
    expect(metaAttributes[1].trim()).toEqual("shrink-to-fit=no"); //includes attribute
    expect(metaAttributes[2].trim()).toEqual("width=device-width"); //includes attribute
  })
})

describe('2. Content is inside of containers for spacing', () => {
  test('header includes container div', () => {
    let container = $('header > div');
    expect(container.length).toBe(1); //main contains 1 container
    expect(container.attr('class')).toEqual('container'); //has correct class
    expect(container.children().get(0).tagName).toBe('h1'); //contains h1 as child
    expect(container.children().get(1).tagName).toBe('p'); //contains p as child
  })

  test('main includes container div', () => {
    let container = $('main > div');
    expect(container.length).toBe(1); //main contains 1 container
    expect(container.attr('class')).toEqual('container'); //has correct class
    expect(container.find('img').length).toBe(4); //contains the 4 images a descendants
  })
})

describe('3. The header is styled as a Jumbotron component', () => {
  test("The header is full-width", () => {
    expect($('header').hasClass('container-fluid')).toBe(true);
  })

  test('The header has white text on a dark background', () => {
    expect($('header').hasClass('bg-dark')).toBe(true);
    expect($('header').hasClass('text-white')).toBe(true);
  })

  test('The header has appropriate padding', () => {
    expect($('header').hasClass('py-5')).toBe(true);
  })


  test('The subtitle is a "lead"', () => {
    expect($('header p').hasClass('lead')).toBe(true);
  })
})

describe('4. "Cards" are styled as Card components', () => {
  let cards = $('main div.card');

	test('Main contains four card divs', () => {
		expect(cards.length).toEqual(4);
	})
	
	test('Cards include "card-body" elements for padding', () => {
		expect(cards.length).toEqual(4); //fail when unimplemented
    cards.each((i, el) => {
      expect($(el).children('div.card-body').length).toBe(1); //each card contains a card-body
    })
	})
	
	test('Card title and text is styled', () => {
		expect(cards.length).toEqual(4); //fail when unimplemented
    cards.each((i, el) => {
      expect($(el).find('h2').hasClass('card-title')).toBe(true); //h2 is card-title
      expect($(el).find('p').hasClass('card-text')).toBe(true); //p is card-text  
    })

	})
	
	test('Links are styled as dark colored buttons', () => {
		expect(cards.length).toEqual(4); //fail when unimplemented
    cards.each((i, el) => {
      expect($(el).find('a').hasClass('btn')).toBe(true);
      expect($(el).find('a').hasClass('btn-dark')).toBe(true);
    })
	})
	
	test('Utility class is used to add spacing below images', () => {
		expect(cards.length).toEqual(4); //fail when unimplemented
    cards.each((i, el) => {
      expect($(el).find('img').hasClass('pb-3')).toBe(true);
    })
	})
	
	test('Utility class is used to add spacing below card elements', () => {
		expect(cards.length).toEqual(4); //fail when unimplemented
    cards.each((i, el) => {
      expect($(el).hasClass('mb-4')).toBe(true);
    })
	})
})

describe('5. Cards are organized into a responsive grid', () => {
  let cards = $('main div.card');

  test('All cards are contained in a grid row', () => {
    let row = $('main .container > .row');
    expect(row.length).toBe(1); //has a row in the container
    expect(row.find('.card').length).toBe(4); //row contains 4 cards
  })
  
  test('Each card is wrapped in a grid column div', () => {
		expect(cards.length).toEqual(4); //fail when unimplemented
    cards.each((i, el) => {
      expect($(el).parent().attr('class')).toMatch(/col/); //has column class
    })
  })

  test('On medium+ screens, cards take up 1/2 the screen', () => {
		expect(cards.length).toEqual(4); //fail when unimplemented
    cards.each((i, el) => {
      expect($(el).parent().hasClass('col-md-6')).toBe(true); //each col is `md-6`
    })
  })
  
  test('On extra-large+ screens, cards take up 1/4 the screen', () => {
		expect(cards.length).toEqual(4); //fail when unimplemented
    cards.each((i, el) => {
      expect($(el).parent().hasClass('col-xl-3')).toBe(true); //each col is `xl-3`
    })
  })

  test('Cards are same height on larger screens', () => {
		expect(cards.length).toEqual(4); //fail when unimplemented
    cards.each((i, el) => {
      expect($(el).parent().hasClass('d-flex')).toBe(true); //each column is flex
    })
  })
})

describe('6. Icon image position is responsive', () => {
  let cardBodies = $('main div.card .card-body');

  test('Card body contains a responsive grid', () => {
		expect(cardBodies.length).toEqual(4); //fail when unimplemented
    cardBodies.each((i, el) => {
      expect($(el).children().hasClass('row')).toBe(true); //card-body has row as child
      expect($(el).children().length).toBe(1); //card-body only has row as child
      let cols = $(el).children().children();
      expect(cols.length).toBe(2); //row has 2 children
      cols.each((i, el) => {
        expect(cols.attr('class')).toMatch(/col/); //each row child is a column
      })
      
      let img = $(el).find('img');
      expect(img.parent().attr('class')).toMatch(/col/); //img parent has column class

      let content = $(el).find('h2, p, a');
      content.each((i, el) => {
        expect($(el).parent().attr('class')).toMatch(/col/); //content in column class
      })
    })
	})  

  test('Card body columns are correct sizes', () => {
		expect(cardBodies.length).toEqual(4); //fail when unimplemented
    cardBodies.each((i, el) => {
      let cols = $(el).children().children();
      expect(cols.eq(0).attr('class')).toMatch(/col-sm-auto/); //first column is auto
      expect(cols.eq(0).attr('class')).toMatch(/col-xl-12/); //first column is xl-12
      expect(cols.eq(1).attr('class')).toEqual('col-sm'); //second column fills
    })
  })
})
