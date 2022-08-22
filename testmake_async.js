var fonts = {
    Cloud: {
        normal: 'assets/fonts/Cloud-Light.ttf',
        bold: 'assets/fonts/Cloud-Bold.ttf'
    },
    Montserrat: {
        normal: 'assets/fonts/Montserrat-Light.ttf',
        bold: 'assets/fonts/Montserrat-Bold.ttf'
    }
};

var PdfPrinter = require("pdfmake");
var fs = require('fs');
var wordCut = require('wordcut')
wordCut.init();
var printer = new PdfPrinter(fonts);

//#region Declare Function
// Thai text wrapping function
function widthCharCount(txt) {
    if (!txt) return 0;
    var thaiFullWidthCharRegex = /[^\u0E31\u0E34-\u0E3E\u0E47-\u0E4E]/g;
    return txt.match(thaiFullWidthCharRegex).length;
}
// Consequence function
function wrapThaiText(thaiTxt, maxLength) {
    linebreak = '\n';
    var segThaiTxt = wordCut.cut(thaiTxt)
        //thai word segmentation with '|'
    var words = segThaiTxt.split('|');
    var txt = '';
    var lineNum = 1
        //loop from start words
    for (var i = 0, line = '', linewlength = 0; i < words.length; i++) {
        var wlen = widthCharCount(words[i]);
        if (/\n|\r/.test(words[i])) {
            //add line to txt
            txt = txt + line;
            //move the word to new line
            line = words[i];
            linewlength = wlen;
            // Count line
            lineNum++
        } else if (linewlength + wlen <= maxLength) {
            line = line + words[i];
            linewlength += wlen;
        } else { //word exceed line length
            //add line to txt
            txt = txt + (line + linebreak);
            //move the word to new line
            line = words[i];
            linewlength = wlen;
            // Count line
            lineNum++
        }
    }
    if (linewlength > 0) {
        txt = txt + line;
    }
    return {
        txt: txt,
        lineNum: lineNum
    }
}
// Function for calling content from info ref + text wrapping
function readInfoRef(infoCode, textNum, lineLimit) {
    return wrapThaiText(info.filter(obj => { return obj.code === infoCode })[0][String("text").concat('_', String(textNum))].replace(/\^/g, '\n'), lineLimit)
}
// Function for calling content from info ref from gfs_code + text wrapping
function readInfoRefFromGFS(gfsCode, textNum, lineLimit) {
    return wrapThaiText(info.filter(obj => { return obj.gfs_code === gfsCode })[0][String("text").concat('_', String(textNum))].replace(/\^/g, '\n'), lineLimit)
}

//#endregion

// Read data file
//#region ReadInfoRef 
const rawInfo = fs.readFileSync('info_ref_mock.txt', 'utf16le').split(/\r?\n/)
    // Count and skip comment row
var commentRow = 0
for (let row = 0; row < rawInfo.length; row++) {
    if (rawInfo[row].trim()[0] == '#') {
        commentRow++
    } else { break }
}
// Check column order and create dictionary
const colNameInfo = rawInfo[commentRow].split(/\t/)
var info = []
for (let row = commentRow + 1; row < rawInfo.length; row++) {
    const record = rawInfo[row].split(/\t/)
    var dict = {}
    if (record.length == colNameInfo.length) {
        for (let col = 0; col < colNameInfo.length; col++) {
            dict[colNameInfo[col]] = record[col]
        }
    } else { break }
    info.push(dict)
}
// Remove unneccesary rows
for (var i = info.length - 1; i >= 0; i--) {
    if (info[i]['code'] == '-') {
        // console.log(info[i]['code'])
        info.splice(i, 1);
    }
}
//#endregion 
//#region ReadRecomRef 
const rawRecom = fs.readFileSync('recom_ref_mock.txt', 'utf16le').split(/\r?\n/)
const colNameRecom = rawRecom[0].split(/\t/)
var recom = []
for (let row = 1; row < rawRecom.length; row++) {
    const record = rawRecom[row].split(/\t/)
    var dict = {}
    if (record.length == colNameRecom.length) {
        for (let col = 0; col < colNameRecom.length; col++) {
            if (['code', 'low_rec', 'medhigh_rec'].includes(colNameRecom[col])) {
                dict[colNameRecom[col]] = record[col]
            }
        }
    } else { break }
    recom.push(dict)
}
// Remove unneccesary rows
for (var i = recom.length - 1; i >= 0; i--) {
    if (recom[i]['low_rec'] == '-') {
        recom.splice(i, 1);
    }
}
//#endregion 
//#region ReadClientData 
const rawData = fs.readFileSync('lifestyle_sample.tsv', 'utf8').split(/\r?\n/)
    // Check column order and create dictionary
const colNameData = rawData[0].split(/\t/)
    // Expected colnames: sex	sample_number	category	number	code	trait	property	reported_genes	snp_id	num_trait_allele	total.snp	interpret.3scale	interpret.report	interpret.5scale	snp.score	filler	filler.1	filler.2	avg.num.snp	avg.scale5	avg.score
var clientData = []
var clientCode = []
for (let row = 1; row < rawData.length; row++) {
    const record = rawData[row].split(/\t/)
    var dict = {}
    if (record.length == colNameData.length) {
        for (let col = 0; col < colNameData.length; col++) {
            if (['sex', 'sample_number', 'code', 'interpret.3scale', 'interpret.5scale', 'avg.scale5'].includes(colNameData[col])) {
                dict[colNameData[col]] = record[col]
                if (colNameData[col] == 'sample_number' & !clientCode.includes(record[col])) {
                    clientCode.push(record[col])
                }
            }
        }
    } else { break }
    clientData.push(dict)
}
// console.log(clientData)
// console.log(clientCode)

// MOCKKKKKKKKKKKKKKKKKKKKKKKK: ADD NU017-Biotin & UN000-Premature grey #############
for (let i = 0; i < clientCode.length; i++) {
    clientData.push({
        sex: clientData.filter(obj => { return obj.sample_number === clientCode[i] })[0].sex,
        sample_number: clientCode[i],
        code: 'NU017',
        'interpret.3scale': 'high',
        'interpret.5scale': '5'
    })
    clientData.push({
        sex: clientData.filter(obj => { return obj.sample_number === clientCode[i] })[0].sex,
        sample_number: clientCode[i],
        code: 'UN000',
        'interpret.3scale': 'high',
        'interpret.5scale': '5',
        'avg.scale5': '3'
    })
}
//#endregion 
// Parameter declaration
const colors = {
    intro: 'red'
}

//#region Generate info pages
var infoContent = []
for (let i = 0; i < info.length; i++) {
    if (info[i].code.substr(0, 3) === 'inf') {
        var subContent = [{
            text: readInfoRef(info[i].code, 'name', 100).txt,
            fontSize: widthCharCount(readInfoRef(info[i].code, 'name', 100).txt) > 15 ? 42 : widthCharCount(readInfoRef(info[i].code, 'name', 100).txt) > 10 ? 55 : 62,
            margin: [42, 40, 260, 0],
            lineHeight: widthCharCount(readInfoRef(info[i].code, 'name', 100).txt) > 15 ? 0.8 : widthCharCount(readInfoRef(info[i].code, 'name', 100).txt) > 10 ? 0.7 : 0.5,
            color: colors['intro']
        }, {
            text: readInfoRef(info[i].code, 'thai', 10).txt,
            fontSize: 44,
            margin: [50, 26, 260, Number(info[i].code.substr(3, 2)) >= 10 ? widthCharCount(readInfoRef(info[i].code, 'name', 100).txt) > 15 ? 66 : widthCharCount(readInfoRef(info[i].code, 'name', 100).txt) > 10 ? 50 : 166 : 46],
            lineHeight: 0.9,
            color: colors['intro']
        }]
        for (let j = 1; j < 5; j++) {
            subContent.push({
                text: readInfoRef(info[i].code, j, (Number(info[i].code.substr(3, 2)) == 7 ? (j == 1 ? 59 : 56) : Number(info[i].code.substr(3, 2)) == 12 ? 56 : 53)).txt,
                fontSize: 17.5,
                margin: [108, 0, 0,
                    (Number(info[i].code.substr(3, 2)) < 10 ?
                        (Number(info[i].code.substr(3, 2)) != 7 ? Number(info[i].code.substr(3, 2)) == 9 ? (j == 3 ? 3 : 5) : (j == 2 ? 4 : 5) : (j == 2 ? 6 : j == 3 ? 4 : 5)) - readInfoRef(info[i].code, j, (Number(info[i].code.substr(3, 2)) == 7 ? (j == 1 ? 59 : 56) : 53)).lineNum :
                        1) * 22
                ],
                lineHeight: 0.9,
                color: colors['intro']
            })
        }
        subContent.push({
            text: '',
            pageBreak: 'after'
        })
        infoContent.push(subContent)

    }
}
//#endregion

//#region Generate scale bar result
var scaleBarResult = []
var scaleBarLegend = []
const suppCode = {
    'NU001': 'Vit-A',
    'NU005': 'Vit-C',
    'NU006': 'Vit-D',
    'NU007': 'Vit-E',
    'NU009': 'Folate',
    'NU011': 'Iron',
    'NU013': 'Omg-3',
    'NU016': 'Zinc',
    'NU017': 'Biotin'
}
for (let code in suppCode) {
    for (let i = 0; i < clientData.length; i++) {
        // console.log(clientData[i])
        if (clientData[i].sample_number == clientCode[0] & clientData[i].code == code) {
            // console.log(clientData[i]['interpret.5scale'], clientData[i].code)
            const scaleLevel = String(clientData[i]['interpret.5scale'])
            scaleBarResult.push({
                image: `assets/img/scale${scaleLevel}.jpg`,
                width: 49.1
            })
            scaleBarLegend.push({
                text: suppCode[code],
                fontSize: 16,
                alignment: 'center',
                color: colors['intro']
            })
        }
    }
}
//#endregion

//#region Generate radar chart result
const ChartJsImage = require('chartjs-to-image');
//MOCK DATA sex
const disCodeAll = {
    SK011: 'Dry Skin',
    SK012: 'Psoriasis',
    SK013: 'Androgenetic\nAlopecia',
    SS004: 'Stress&\nSleep',
    LV007: 'Premature\nMenopause',
    UN000: 'Premature\nGrey'
}
var disCode = disCodeAll
const mockSex = 'F'
if (mockSex == 'M') {
    delete disCode.LV007
}
var clientDisData = []
var popDisData = []
for (code in disCode) {
    for (let i = 0; i < clientData.length; i++) {
        if (clientData[i].sample_number == clientCode[0] & clientData[i].code == code) {
            clientDisData.push(clientData[i]['interpret.5scale'])
            popDisData.push(clientData[i]['avg.scale5'])
        }
    }
}
var disName = Object.keys(disCode).map(function(key) {
    return disCode[key];
});
const radarChart = new ChartJsImage();
radarChart.setConfig({
    type: 'radar',
    data: {
        labels: disName,
        datasets: [{
            label: 'Client',
            data: clientDisData,
            fill: true,
            backgroundColor: 'rgba(0, 0, 0, 0)',
            borderColor: '#FFC000',
            borderWidth: 4,
            pointRadius: 0
        }, {
            label: 'Population',
            data: popDisData,
            fill: true,
            backgroundColor: 'rgba(253, 179, 58, 0.2)',
            borderColor: 'rgba(0, 0, 0, 0)',
            pointRadius: 0
        }]
    },
    options: {
        legend: {
            display: false,
        },
        scale: {
            ticks: {
                showLabelBackdrop: false,
                beginAtZero: true,
                precision: 0,
                z: 1,
                fontSize: 18
            },
            pointLabels: {
                fontSize: 20
            }
        }
    }
});
radarChart.setBackgroundColor(0, 0, 0, 0).setHeight(500).setDevicePixelRatio(2)
    //#endregion

//#region Generate point recommendation
// Already declare suppCode above
var pointRecom = []
var colContent = []
var codeCount = 0
for (let code in suppCode) {
    codeCount++
    for (let i = 0; i < clientData.length; i++) {
        if (clientData[i].sample_number == clientCode[0] & clientData[i].code == code) {
            // Please add option check somewhere
            var scaleLevel = String(clientData[i]['interpret.3scale'])
            if (scaleLevel == 'med' | scaleLevel == 'high') {
                scaleLevel = 'medhigh'
            }
            var textNline = { text: recom.filter(obj => { return obj.code === code })[0][String(scaleLevel).concat('_rec')].replace(/\^| /g, '\n') }
            textNline.line = (textNline.text.match(/\n/g) || []).length + 1
            colContent.push({
                image: `assets/img/recom_${scaleLevel}.png`,
                alignment: 'center',
                margin: [0, 25, 0, 0],
                width: 110
            }, {
                text: textNline.text,
                fontSize: 19,
                lineHeight: 0.7,
                alignment: 'center',
                margin: [0, textNline.line > 2 ? -82 : -65, 0, 0],
            }, {
                text: suppCode[code],
                alignment: 'center',
                fontSize: 22,
                margin: [0, textNline.line > 2 ? 39 : 40, 0, 0],
            })
            if (codeCount % 3 == 0) {
                pointRecom.push(colContent)
                colContent = []
            }
        }
    }
}
//#endregion

//#region Generate rect recommendation
// Already declare disCodeAll and disCode (filtered with gender)
var rectRecom = []
var pageContent = []
var codeCount = 0
for (let code in disCode) {
    codeCount++
    for (let i = 0; i < clientData.length; i++) {
        if (clientData[i].sample_number == clientCode[0] & clientData[i].code == code) {
            // Please add option check somewhere
            var scaleLevel = String(clientData[i]['interpret.3scale'])
            if (scaleLevel == 'med' | scaleLevel == 'high') {
                scaleLevel = 'medhigh'
            }
            var titleNline = { text: recom.filter(obj => { return obj.code === code })[0][String(scaleLevel).concat('_rec')].replace(/\^| /g, '\n') }
            titleNline.line = (titleNline.text.match(/\n/g) || []).length + 1
                // Move disease recommendation to recom_ref file
            var rectSize = ""
            if (titleNline.line = 1) {
                rectSize = 'short'
            } else {
                rectSize = 'long'
            }
            var subContent = [{
                columns: [
                    [{
                        image: `assets/img/rect_${rectSize}_${scaleLevel}.png`,
                        alignment: 'center',
                        margin: [0, 25, 0, 0],
                        width: 110
                    }, {
                        text: titleNline.text,
                        fontSize: 19,
                        lineHeight: 0.7,
                        alignment: 'center',
                        margin: [0, titleNline.line > 2 ? -82 : -65, 0, 0],
                    }, {
                        text: suppCode[code],
                        alignment: 'center',
                        fontSize: 22,
                        margin: [0, titleNline.line > 2 ? 39 : 40, 0, 0],
                    }],
                    [

                    ]
                ]
            }]
            pageContent.push(subContent)
            if (codeCount % 2 == 0) {
                rectRecom.push([{
                    columns: [{
                        text: 'Recommendation',
                        margin: [34, 58, 0, 0],
                        lineHeight: 1,
                        style: 'eng',
                        fontSize: 26,
                        width: 'auto',
                        color: colors['intro']
                    }, {
                        text: 'รายการคำแนะนำเฉพาะคุณ',
                        fontSize: 24,
                        margin: [10, 62, 0, 0],
                        lineHeight: 1,
                        color: colors['intro']
                    }]
                }, {
                    text: wrapThaiText('ความเสี่ยงโรคและความผิดปกติที่อาจเกิดผลเกี่ยวกับเส้นผมและหนังศีรษะของคุณ', 40).txt,
                    fontSize: 22,
                    margin: [110, 37, 0, 10],
                    lineHeight: 0.9,
                    color: colors['intro']
                }, {
                    columns: pageContent,
                    margin: [60, 0, 60, 0],
                }, {
                    text: '',
                    pageBreak: 'after'
                }])
                pageContent = []
            }
        }
    }
}
//#endregion





// Generate report
async function createDocDefinition() {
    const radarChartResult = await radarChart.toDataUrl();
    // const radarChartResult = radarChart.toBinary();
    // console.log('cat', radarChartResult)
    return {
        pageSize: 'A4',
        pageMargins: [20, 40, 10, 20],
        defaultStyle: {
            font: 'Cloud',
            characterSpacing: 0.01,
            color: 'red'
        },
        styles: {
            eng: {
                font: 'Montserrat',
                fontSize: 22,
                characterSpacing: 0.2,
            }
        },
        background: function(currentPage, pageSize) {
            if (currentPage <= 24) {
                return {
                    image: `assets/img/p${currentPage}.jpg`,
                    width: 595.28
                }
            }
            //  size 595.28 x 841.89
            // return `page ${currentPage} with size ${pageSize.width} x ${pageSize.height}`

        },
        content: [
            // Page 1 - Cover
            [{
                    text: 'เอกสารข้อมูลคำอธิบายการตรวจพันธุกรรมเฉพาะบุคคล',
                    fontSize: 22,
                    margin: [25, 130, 0, 0],
                    // color: '#4A90E2'
                },
                {
                    text: 'Personalized Genetic Report',
                    margin: [25, 0, 0, 0],
                    style: 'eng'
                        // color: '#537E9B'
                },
                {
                    text: 'Report date: 7 May 2022\n\nCustomer: CV01234567',
                    margin: [32, 202, 0, 0],
                    style: 'eng',
                    fontSize: 18
                        // color: '#537E9B'
                },
                {
                    text: '',
                    pageBreak: 'after'
                }
            ],
            // Page 2 - Intro
            [{
                text: 'รหัสพันธุกรรมคืออะไร',
                fontSize: 17.5,
                margin: [1, 20, 0, 0],
                decoration: 'underline',
                lineHeight: 1,
                color: colors['intro']
            }, {
                text: readInfoRef('int00', 1, 33).txt,
                fontSize: 17.5,
                margin: [0, 0, 210, 0],
                lineHeight: 0.9,
                color: colors['intro']
            }, {
                text: readInfoRef('int00', 2, 33).txt,
                fontSize: 17.5,
                margin: [0, 22, 210, 0],
                lineHeight: 0.9,
                color: colors['intro']
            }, {
                text: readInfoRef('int00', 3, 33).txt,
                fontSize: 17.5,
                margin: [0, 22, 210, 0],
                lineHeight: 0.9,
                color: colors['intro']
            }, {
                text: readInfoRef('int00', 4, 33).txt,
                fontSize: 17.5,
                margin: [0, 22, 210, 0],
                lineHeight: 0.9,
                color: colors['intro']
            }, {
                text: readInfoRef('int00', 5, 33).txt,
                fontSize: 17.5,
                margin: [0, 22, 210, 0],
                lineHeight: 0.88,
                color: colors['intro']
            }, {
                text: '',
                pageBreak: 'after'
            }],
            // Page 3 - Summary
            [{
                    columns: [{
                        text: 'Summary',
                        margin: [34, 60, 0, 0],
                        lineHeight: 1,
                        style: 'eng',
                        fontSize: 26,
                        width: 'auto',
                        color: colors['intro']
                    }, {
                        text: 'สรุปรายงานพันธุกรรม',
                        fontSize: 22,
                        margin: [10, 66, 0, 0],
                        lineHeight: 1,
                        color: colors['intro']
                    }]
                }, {
                    text: 'วิตามินและแร่ธาตุที่คุณมีแนวโน้มที่จะขาด',
                    fontSize: 22,
                    margin: [90, 45, 0, 0],
                    lineHeight: 0.9,
                    color: colors['intro']
                },
                {
                    columns: scaleBarResult,
                    columnGap: 6.3,
                    margin: [33, 51, 40, 0]
                }, {
                    columns: scaleBarLegend,
                    columnGap: 6.5,
                    margin: [33, 20, 40, 0]
                }, {
                    text: wrapThaiText('ความเสี่ยงโรคและความผิดปกติที่อาจเกิดผลเกี่ยวกับเส้นผมและหนังศีรษะของคุณ', 40).txt,
                    fontSize: 22,
                    margin: [90, 38, 0, 0],
                    lineHeight: 0.9,
                    color: colors['intro']
                }, {
                    image: radarChartResult,
                    width: 340,
                    margin: [110, -20, 0, 0],
                }, {
                    text: '',
                    pageBreak: 'after'
                }
            ],
            // Page 4 - Topic info
            [{
                text: 'รายละเอียดและความสำคัญ',
                fontSize: 44,
                margin: [48, 390, 0, 0],
                lineHeight: 1,
                color: colors['intro']
            }, {
                text: '',
                pageBreak: 'after'
            }],
            // Page 5++ - Info content
            infoContent,
            // Page 6 - Topic recommend
            [{
                text: 'คำแนะนำสำหรับคุณ',
                fontSize: 44,
                margin: [48, 390, 0, 0],
                lineHeight: 1,
                color: colors['intro']
            }, {
                text: '',
                pageBreak: 'after'
            }],
            // Page 7++ - Recommend suppl
            [{
                columns: [{
                    text: 'Recommendation',
                    margin: [34, 58, 0, 0],
                    lineHeight: 1,
                    style: 'eng',
                    fontSize: 26,
                    width: 'auto',
                    color: colors['intro']
                }, {
                    text: 'รายการคำแนะนำเฉพาะคุณ',
                    fontSize: 24,
                    margin: [10, 62, 0, 0],
                    lineHeight: 1,
                    color: colors['intro']
                }]
            }, {
                text: 'ปริมาณวิตามินและแร่ธาตุต่อวันเฉพาะคุณ',
                fontSize: 22,
                margin: [90, 46, 0, 10],
                lineHeight: 0.9,
                color: colors['intro']
            }, {
                columns: pointRecom,
                margin: [60, 0, 60, 0],
            }, {
                text: '',
                pageBreak: 'after'
            }],
            // Page 8++ - Recommend disea
            rectRecom,


            // {
            //     image: 'assets/img/p1.jpg',
            //     width: 150
            // }

        ]
    };
}
// console.log(infoContent)

async function createPDF() {
    const docDefinition = await createDocDefinition()
    var pdfDoc = printer.createPdfKitDocument(docDefinition);
    pdfDoc.pipe(fs.createWriteStream('pdf/basics.pdf'));
    pdfDoc.end();
}

createPDF()