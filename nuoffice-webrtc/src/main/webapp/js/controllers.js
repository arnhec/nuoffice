var appControllers = angular.module('controllers', []);

appControllers.controller('MainCtrl', [
		'$scope', '$location',
		function($scope,$location) {


			
			$scope.isValid = function(attrs) {
				if (attrs.href === "#situation") {
					return true;
				} else if (attrs.href === "#tarifmerkmale") {
					return $scope.situationValid();
				} else if (attrs.href === "#versicherungsschutz") {
					return $scope.tarifmerkmaleValid();
				} else if (attrs.href === "#ergebnis") {
					return $scope.versicherungsschutzValid();
				}

			};

			$scope.situationValid = function() {

				var result = $scope.versicherungsbeginn
						&& $scope.versicherungsnehmer && $scope.eigentuemer
						&& $scope.fahrzeugart && $scope.fahrzeugzulassung;
				return true || result;
			};
			$scope.tarifmerkmaleValid = function() {

				var result = $scope.fahrzeugleistung && $scope.abstellort
						&& $scope.nutzungsart && $scope.nutzer
						&& $scope.geburtsdatum && $scope.wohneigentum
						&& $scope.branche;
				return true || result;
			};
			$scope.versicherungsschutzValid = function() {
				var result = $scope.uebernahmeScheidenfreiheitsklasse
						&& $scope.verbleibBisherigesFahrzeug
						&& $scope.fuehrerschein3Jahre && $scope.kasko
						&& $scope.tarif;
				return result;
			};

			$scope.activeTab = 'situation';

			$scope.weiter = function() {
				if ($scope.activeTab === 'situation' ) {
					$("#myTab a[name='tarifmerkmale'").click();
				} else
					if ($scope.activeTab === 'tarifmerkmale' ) {
						$("#myTab a[name='versicherungsschutz'").click();
					}
			};
			$scope.zurueck = function() {
				if ($scope.activeTab === 'tarifmerkmale' ) {
					$("#myTab a[name='situation'").click();
				} else
					if ($scope.activeTab === 'versicherungsschutz' ) {
						$("#myTab a[name='tarifmerkmale'").click();
					}
			};
			
			
			$scope.weiterEnabled = function() {
				return $scope.activeTab === 'situation' && $scope.situationValid() 
				|| $scope.activeTab === 'tarifmerkmale' && $scope.tarifmerkmaleValid();
			};

			$scope.aktion = "1";

			$scope.versicherungsnehmerListe = [ {
				id : 1,
				label : 'Privatperson'
			}, {
				id : 2,
				label : 'Firma'
			} ];

			$scope.fahrzeugarten = [ {
				id : 1,
				label : 'PKW'
			}, {
				id : 2,
				label : 'Motorrad'
			}, {
				id : 3,
				label : 'Motorroller'
			} ];

			$scope.herstellerListe = [ {
				id : "1",
				label : 'Alfa-Romeo'
			}, {
				id : "2",
				label : 'Audi'
			}, {
				id : "3",
				label : 'BMW'
			}, {
				id : "4",
				label : 'Citroen'
			}, {
				id : "5",
				label : 'Dacia'
			}, {
				id : "6",
				label : 'Fiat'
			}, {
				id : "7",
				label : 'Mercedes'
			}, {
				id : "8",
				label : 'Volkswagen'
			} ];

			$scope.modelle = [ {
				id : 101,
				hersteller : "1",
				label : 'Idea'
			}, {
				id : 102,
				hersteller : "1",
				label : 'Kappa'
			}, {
				id : 103,
				hersteller : "1",
				label : 'GT'
			}, {
				id : 104,
				hersteller : "1",
				label : 'GTV'
			}, {
				id : 201,
				hersteller : "2",
				label : 'A1'
			}, {
				id : 202,
				hersteller : "2",
				label : 'A2'
			}, {
				id : 203,
				hersteller : "2",
				label : 'A3'
			}, {
				id : 204,
				hersteller : "2",
				label : 'A4'
			}, {
				id : 205,
				hersteller : "2",
				label : 'A5'
			}, {
				id : 206,
				hersteller : "2",
				label : 'A6'
			} ];

			$scope.baujahreListe = [];

			for (var i = 2015; i > 1979; i--) {
				$scope.baujahreListe.push(i);
			}
			;

			$scope.criteriaMatch = function() {
				return function(item) {
					return item.hersteller === $scope.hersteller;
				};
			};

			$scope.fahrzeugsucheEnabled = function() {
				var result = ($scope.hersteller > 0 && $scope.modell > 0
						& $scope.baujahr > 0);
				return result;
			};

			$scope.eigentuemerListe = [ {
				id : 1,
				label : 'auf mich'
			}, {
				id : 2,
				label : 'auf meinen Ehe-/Lebenspartner'
			}, {
				id : 3,
				label : 'auf eine andere Person'
			} ];

			$scope.nutzer = [];

			$scope.toggleNutzer = function(id) {
				var idx = $scope.nutzer.indexOf(id);

				// is currently selected
				if (idx > -1) {
					$scope.nutzer.splice(idx, 1);
				}
				// is newly selected
				else {
					$scope.nutzer.push(id);
				}
			};

			$scope.abstellorte = [ {
				id : 1,
				label : "Einzel-/Doppelgarage"
			}, {
				id : 2,
				label : "Einzel-/Doppelcarport"
			} ];

			$scope.nutzungsarten = [ {
				id : 1,
				label : "ausschließlich privat"
			}, {
				id : 2,
				label : "privat und geschäftlich"
			}, {
				id : 3,
				label : "ausschließlich geschäftlich"
			} ];

			$scope.nutzerListe = [ {
				id : 1,
				label : "ich selbst"
			}, {
				id : 2,
				label : "Partner"
			}, {
				id : 4,
				label : "Kind/Kinder"
			}, {
				id : 8,
				label : "Sonstige"
			} ];

			$scope.wohneigentumListe = [ {
				id : 1,
				label : "nicht vorhanden"
			}, {
				id : 2,
				label : "Einfamilienhaus"
			}, {
				id : 3,
				label : "Mehrfamilienhaus"
			}, {
				id : 4,
				label : "Reihenhaus/Doppelhaushälfte"
			}, {
				id : 4,
				label : "Eigentumswohnung"
			} ];

			$scope.taetigkeiten = [ {
				id : 1,
				label : "Angestellte"
			}, {
				id : 2,
				label : "Arbeiter/-innen"
			}, {
				id : 3,
				label : "Beamte/-innen"
			}, {
				id : 4,
				label : "ohne Beschäftigungsverhältnis"
			}, {
				id : 4,
				label : "Rentner/-innen / Pensionär/-innen"
			} ];

			$scope.branchen = [ {
				id : 1,
				label : "Agrar"
			}, {
				id : 2,
				label : "Öffentlicher Dienst"
			}, {
				id : 3,
				label : "Banken/Versicherungen"
			}, {
				id : 4,
				label : "Sonstige"
			} ];

			$scope.uebernahmenScheidenfreiheitsklasse = [ {
				id : 1,
				label : "Ja, von meinem bisherigen Versicherer"
			}, {
				id : 2,
				label : "Ja, von einer anderen Person/Firma"
			}, {
				id : 3,
				label : "Nein, es ist ein zusätzliches Fahrzeug"
			}, {
				id : 4,
				label : "Nein, es ist mein allererstes Fahrzeug"
			} ];

			$scope.verbleibeBisherigesFahrzeug = [ {
				id : 1,
				label : "ist abgemeldet/verkauft"
			}, {
				id : 2,
				label : "wird abgemeldet/verkauft"
			}, {
				id : 3,
				label : "wird nicht verkauft/abgemeldet"
			} ];

			$scope.kaskoOptionen = [ {
				id : 1,
				label : "Ja, Vollkasko inkl. Teilkasko"
			}, {
				id : 2,
				label : "Ja, Teilkasko"
			}, {
				id : 3,
				label : "Nein, keine Kasko"
			} ];

			$scope.tarife = [ {
				id : 1,
				label : "Basis"
			}, {
				id : 2,
				label : "Komfort"
			}, {
				id : 3,
				label : "Premium"
			} ];

			$scope.tarifoptionen = [ {
				id : 1,
				label : "Schutzbrief"
			}, {
				id : 2,
				label : "Fahrerschutz-Versicherung"
			}, {
				id : 4,
				label : "GAP"
			} ];
			$scope.tarifoption = [];
			$scope.toggleTarifoption = function(id) {
				var idx = $scope.tarifoption.indexOf(id);

				// is currently selected
				if (idx > -1) {
					$scope.tarifoption.splice(idx, 1);
				}
				// is newly selected
				else {
					$scope.tarifoption.push(id);
				}
			};

		} ]);
