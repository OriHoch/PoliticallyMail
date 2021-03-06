(function() {
	var that = this;

	this.go = function(is_active) {
		if (is_active === true) {
			this.body = document.getElementsByTagName('body')[0];
			this.regs = [];
			this.dictionary = [];
			this.dynamicTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'PARAM'];
			this.words_count = 0;
//			this.whitespace = "((\\s\\s)|\\s|[^a-zא-תа-я]|ה|^|$)+";
			this.whitespace = "((\\s|ה)+|^|$)";

			this.notDynamic = function(node) {
				for (var i in that.dynamicTags) {
					if (that.dynamicTags[i] == node) {
						return false;
					}
				}
				return true;
			};

			this.cleanInmostNodes = function(e) {
				var items = that.getTextNodes(e);
				var item = null;
				var OriginalString = null;
				var PotentialKarma = null;
				var PotentiallyCleanElements = null;
				var TemporaryPotentialCleanElement = null;
				var CollectingPos = 0;
				var CollectingPart = 0;
				var CollectingPartLength = 0;
				var nodeIndex = 0;

				for (var i = 0, kProgressor = 0, iEnd = items.length; i < iEnd; i++, kProgressor = 0) {
					OriginalString = items[i].nodeValue;
					item = items[i].parentNode;
					nodeIndex = that.getIndex(items[i]);

					for (var k = kProgressor; k < that.words_count; k++) {
						if (that.regs[k].test(OriginalString)) {
							OriginalString = OriginalString.replace(that.whitespace, ' ');
							PotentialKarma = that.get_indices(k, OriginalString);
							TemporaryPotentialCleanElement = null;
							CollectingPos = 0;
							CollectingPart = 0;
							CollectingPartLength = 0;
							PotentiallyCleanElements = document.createDocumentFragment();
							for (var p = 0, pEnd = PotentialKarma.length, CollectingPartLength = that.dictionary[k].name.length; p < pEnd; p++) {
								CollectingPart = PotentialKarma[p];
								PotentiallyCleanElements.appendChild(document.createTextNode(OriginalString.substr(0, CollectingPart)));
								PotentiallyCleanElements.appendChild(that.CleanKarma(OriginalString.substr(CollectingPart, CollectingPartLength)));
								CollectingPos += CollectingPart + CollectingPartLength;
							}
							/* append the last part, if such exists */
							PotentiallyCleanElements.appendChild(document.createTextNode(OriginalString.substr(CollectingPos)));
							/* replace that child */
							item.replaceChild(PotentiallyCleanElements, item.childNodes[nodeIndex]);
							items.splice.apply(items, [i, 1].concat(item.childNodes));

							kProgressor = k + 1;
							iEnd += PotentiallyCleanElements.childNodes.length -1;
							i--;
							break;
						}
					}
				}
			};

			this.CleanKarma = function(GoodIntention) {
				var CleanA = document.createElement('A');
				CleanA.style.color = '#0000FF';
				CleanA.style.display = 'inline';
				CleanA.style.fontSize = 'inherit';
				CleanA.style.textDecoration = 'underline';
				CleanA.style.cursor = 'pointer';
				CleanA.data = GoodIntention;
				CleanA.setAttribute('href', 'mailto:'+that.dictionary[GoodIntention].email);

				var CleanText = document.createTextNode(GoodIntention);

				CleanA.appendChild(CleanText);

				return CleanA;
			};

			this.get_indices = function(needleKey, haystack) {
				var indices = [];
				var needle = that.dictionary[needleKey].name;
				var i=-1;
				haystack = haystack.toLowerCase();
				while(( i = haystack.indexOf(needle, i+1)) >= 0) {
					indices.push(i);
				}
				return indices;
			};

			this.getTextNodes = function(el){
				var cur;
				var ret = [];
				var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
				while(cur = walker.nextNode()) {
					ret.push(cur);
				}
				return ret;
			};

			/* get the childNode's index */
			this.getIndex = function(el) {
				var nodeIndex = 0;
				while( (el = el.previousSibling) != null ) {
					nodeIndex++;
				}
				return nodeIndex;
			};

			this.run = function(dict) {
				that.dictionary = dict;
				that.words_count = that.dictionary.length;
				if (that.words_count > 1) {
					for (var i = 0; i < that.words_count; i++) {
						that.regs.push('('+that.dictionary[i].name.replace(/( |_)/g, that.whitespace)+')');
					}
					that.regs = new RegExp('('+that.regs.join('|')+')', 'ig');

					that.cleanInmostNodes(that.body);
					that.body.addEventListener(
						'DOMSubtreeModified',
						function(e) {
							that.cleanInmostNodes(e.target);
						},
						false
					);
				}
			};

			chrome.extension.sendRequest({'GetDict': true}, function(response) {
				if (response['dict'].length > 0){
					that.run(response['dict'].split(';'));
				}
			});
		}
	};

	window.addEventListener(
		'load',
		function() {
			chrome.extension.sendRequest({'GetPoliticallyMail': true}, function(response) {
				that.go(response['PoliticallyMail']);
			});
		},
		false
	);
})();