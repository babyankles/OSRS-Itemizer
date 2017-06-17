$(function() {
  const rows = 30,
    columns = 26,
    cellwidth = 31,
    cellheight = 35,
    topleft = {x: -27, y: -25},
    diaries = {topleft: {r: 3, c: 22}, rows: 4, cols: 2},
    diaryTypes = ['offdiary','easydiary','meddiary','harddiary','elitediary'];
  let $table = $('#items_table'),
    onoff = localStorage.getItem('onoff'),
    onoffdiaries = localStorage.getItem('onoffdiaries'),
    rsn = localStorage.getItem('rsn') || '';
  onoff = onoff ? JSON.parse(onoff) : Array(rows).fill(false).map(x => Array(columns).fill(false));
  onoffdiaries = onoffdiaries ? JSON.parse(onoffdiaries) : Array(diaries.topleft.r+diaries.rows).fill(0).map(x => Array(diaries.topleft.c+diaries.cols).fill(0));
  $('#rsn').val(rsn);
  
  function inDiaries(row,col) { //check if cell is part of diaries
    return row>=diaries.topleft.r && row<=diaries.topleft.r+diaries.rows
      && col>=diaries.topleft.c && col<=diaries.topleft.c+diaries.cols;
  }
  
  //create table to show on images
  let rowTemplate = $('<tr></tr>');
  let cellTemplate = $('<td class="cell"></td>');
  for(let row = 0;row < rows;row++) {
    let temprow = rowTemplate.clone().val(row);
    for(let col = 0;col < columns;col++) {
      let tempcell = cellTemplate.clone().val(col);
      if(inDiaries(row,col)) { //handle diary cells separately
        let r = row-diaries.topleft.r,
          c = col-diaries.topleft.c;
        tempcell.addClass('diary').addClass(diaryTypes[onoffdiaries[r][c]]);
        tempcell.css('background-position',(-cellwidth*c)+'px '+(-cellheight*r)+'px');
      } else {
        if(onoff[row][col]) {
          tempcell.addClass('on').css('background-position',(topleft.x-cellwidth*col)+'px '+(topleft.y-cellheight*row)+'px');
        } else {
          tempcell.addClass('off').css('background-position',(topleft.x-cellwidth*col)+'px '+(topleft.y-cellheight*row)+'px');
        }
      }
      temprow.append(tempcell);
    }
    $table.append(temprow);
  }
  
  //handle on/off clicking
  $('.cell.on,.cell.off').click(function() {
    let $this = $(this),
      r = $this.parent().val(),
      c = $this.val();
    onoff[r][c] = !onoff[r][c];
    if(onoff[r][c]) {
      $this.removeClass('off');
      $this.addClass('on');
    } else {
      $this.removeClass('on');
      $this.addClass('off');
    }
    localStorage.setItem('onoff',JSON.stringify(onoff));
  });
  $('.cell.diary').click(function() {
    let $this = $(this),
      r = $this.parent().val()-diaries.topleft.r,
      c = $this.val()-diaries.topleft.c;
    onoffdiaries[r][c]++;
    if(onoffdiaries[r][c]>=diaryTypes.length) onoffdiaries[r][c] = 0;
    $this.removeClass().addClass('cell diary').addClass(diaryTypes[onoffdiaries[r][c]]);
    localStorage.setItem('onoffdiaries',JSON.stringify(onoffdiaries));
  })
  
  //setup clue inputs
  const cluerow = 17,
    cluefirstcell = cluerow*26, //26 cells per row
    clues = {
      easy: 2,
      med: 5,
      hard: 8,
      elite: 11,
      master: 14,
      total: 17
    };
  let cluecounts = localStorage.getItem('cluecounts');
  cluecounts = cluecounts ? JSON.parse(cluecounts) : {
    easy: 0,
    med: 0,
    hard: 0,
    elite: 0,
    master: 0,
    total: 0
  };
  for(let cluetype in clues) {
    let clue = $table.find('td').eq(clues[cluetype]+cluefirstcell);
    clue.attr('colspan',2).removeClass('off').addClass('center-text').next().remove();
    clue.append('<input type="number" id="clue_'+cluetype+'" min="0" value="'+cluecounts[cluetype]+'">');
  }
  $('#clue_total').prop('disabled',true);
  $('.cell input[type="number"]').change(function() {
    cluecounts[this.id.substring(5)] = this.value;
    let totalval = $('.cell input[type="number"]').toArray().slice(0,-1).reduce((sum,elem) => sum += parseInt(elem.value),0);
    $('#clue_total').val(totalval);
    cluecounts['total'] = totalval;
    localStorage.setItem('cluecounts',JSON.stringify(cluecounts));
  });
  
  //name change
  $('#rsn').change(function() {
    rsn = this.value;
    localStorage.setItem('rsn',rsn);
  });
  
  $(window).on('unload',function() {
    $('input').blur(); //change events only triggered on blur, so force update all inputs
  });
  
  //setup download
  let canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d'),
    imgback = document.createElement('img'),
    imgfront = document.createElement('img'),
    imgdiary = {
      offdiary: document.createElement('img'),
      easydiary: document.createElement('img'),
      meddiary: document.createElement('img'),
      harddiary: document.createElement('img'),
      elitediary: document.createElement('img')
    };
  imgback.onload = function() {
    canvas.width = imgback.width;
    canvas.height = imgback.height;
    ctx.font = "20px RuneScape Bold Font Regular";
    ctx.fillText("0123456789",0,0); //need to preload the font
  }
  imgback.src = "images/Background.png";
  imgfront.src = "images/Foreground.png";
  imgdiary.offdiary.src = "images/Easy Back.png";
  imgdiary.easydiary.src = "images/Easy Front.png";
  imgdiary.meddiary.src = "images/Medium Front.png";
  imgdiary.harddiary.src = "images/Hard Front.png";
  imgdiary.elitediary.src = "images/Elite Front.png";
  
  $('#download').click(function() {
    ctx.drawImage(imgback,0,0);
    for(let row = 0;row < rows;row++) {
      for(let col = 0;col < columns;col++) {
        if(inDiaries(row,col)) { //handle diary cells separately
          let r = row-diaries.topleft.r,
          c = col-diaries.topleft.c;
          ctx.drawImage(imgdiary[diaryTypes[onoffdiaries[r][c]]],c*cellwidth,r*cellheight,cellwidth,cellheight,cellwidth*col-topleft.x,cellheight*row-topleft.y,cellwidth,cellheight);
        } else if(onoff[row][col]) {
          ctx.drawImage(imgfront,cellwidth*col-topleft.x,cellheight*row-topleft.y,cellwidth,cellheight,cellwidth*col-topleft.x,cellheight*row-topleft.y,cellwidth,cellheight);
        }
      }
    }
    let count = 1; //need increment because clues object values are based on already shrunken number of cells in the row from changing colspan
    ctx.textAlign = "center";
    for(let clue in cluecounts) {
      ctx.fillText(cluecounts[clue],(clues[clue]+count++)*cellwidth-topleft.x,(cluerow+1)*cellheight-topleft.y);
    }
    ctx.textAlign = "start";
    ctx.fillText('RSN: '+rsn,25,canvas.height-25);
    
    let a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'Items.png';
    a.click();
  });
});