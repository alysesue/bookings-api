import { MyInfoResponse } from '../../../models/myInfoTypes';

export const infoRawMock = (_nric: string): MyInfoResponse => {
	return {
		uinfin: {
			unavailable: false,
			value: _nric,
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		name: {
			value: 'John Doe MyInfo',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
			unavailable: false,
		},
		hanyupinyinname: {
			unavailable: false,
			value: 'John Doe MyInfo',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		aliasname: {
			unavailable: false,
			value: 'John Doe Alias',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		hanyupinyinaliasname: {
			unavailable: false,
			value: 'TRICIA CHEN XIAO HUI',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		marriedname: {
			unavailable: false,
			value: '',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		sex: {
			unavailable: false,
			code: 'M',
			desc: 'MALE',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		race: {
			unavailable: false,
			code: 'CN',
			desc: 'CHINESE',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		secondaryrace: {
			unavailable: false,
			code: 'EU',
			desc: 'EURASIAN',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		dialect: {
			unavailable: false,
			code: 'SG',
			desc: 'SWISS GERMAN',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		nationality: {
			unavailable: false,
			code: 'SG',
			desc: 'SINGAPORE CITIZEN',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		dob: {
			unavailable: false,
			value: '1958-05-17',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		birthcountry: {
			unavailable: false,
			code: 'SG',
			desc: 'SINGAPORE',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		residentialstatus: {
			unavailable: false,
			code: 'C',
			desc: 'CITIZEN',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		passportnumber: {
			unavailable: false,
			value: 'E35463874W',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		passportexpirydate: {
			unavailable: false,
			value: '2020-01-01',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		regadd: {
			unavailable: false,
			type: 'SG',
			block: {
				value: '548',
			},
			building: {
				value: '',
			},
			floor: {
				value: '09',
			},
			unit: {
				value: '128',
			},
			street: {
				value: 'BEDOK NORTH AVENUE 1',
			},
			postal: {
				value: '460548',
			},
			country: {
				code: 'SG',
				desc: 'SINGAPORE',
			},
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		mailadd: {
			unavailable: false,
			type: 'SG',
			block: {
				value: '548',
			},
			building: {
				value: '',
			},
			floor: {
				value: '09',
			},
			unit: {
				value: '128',
			},
			street: {
				value: 'BEDOK NORTH AVENUE 1',
			},
			postal: {
				value: '460548',
			},
			country: {
				code: 'SG',
				desc: 'SINGAPORE',
			},
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		billadd: {
			unavailable: false,
			type: 'SG',
			block: {
				value: '548',
			},
			building: {
				value: '',
			},
			floor: {
				value: '09',
			},
			unit: {
				value: '128',
			},
			street: {
				value: 'BEDOK NORTH AVENUE 1',
			},
			postal: {
				value: '460548',
			},
			country: {
				code: 'SG',
				desc: 'SINGAPORE',
			},
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		housingtype: {
			unavailable: false,
			code: '123',
			desc: 'TERRACE HOUSE',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		hdbtype: {
			unavailable: false,
			code: '112',
			desc: '2-ROOM FLAT (HDB)',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		hdbownership: [
			{
				unavailable: false,
				noofowners: {
					value: 2,
				},
				address: {
					type: 'SG',
					block: {
						value: '548',
					},
					building: {
						value: '',
					},
					floor: {
						value: '09',
					},
					unit: {
						value: '128',
					},
					street: {
						value: 'BEDOK NORTH AVENUE 1',
					},
					postal: {
						value: '460548',
					},
					country: {
						code: 'SG',
						desc: 'SINGAPORE',
					},
				},
				hdbtype: {
					code: '112',
					desc: '2-ROOM FLAT (HDB)',
				},
				leasecommencementdate: {
					value: '2008-06-13',
				},
				termoflease: {
					value: 99,
				},
				dateofpurchase: {
					value: '2008-06-13',
				},
				dateofownershiptransfer: {
					value: '2018-06-13',
				},
				loangranted: {
					value: 310000.01,
				},
				originalloanrepayment: {
					value: 25,
				},
				balanceloanrepayment: {
					years: {
						value: 2,
					},
					months: {
						value: 6,
					},
				},
				outstandingloanbalance: {
					value: 50000.01,
				},
				monthlyloaninstalment: {
					value: 1000.01,
				},
				classification: 'C',
				source: '1',
				lastupdated: '2019-03-26',
			},
		],
		ownerprivate: {
			unavailable: false,
			value: false,
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		email: {
			unavailable: false,
			value: 'address@mail.com',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		homeno: {
			unavailable: false,
			prefix: {
				value: '+',
			},
			areacode: {
				value: '65',
			},
			nbr: {
				value: '66132665',
			},
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		mobileno: {
			unavailable: false,
			prefix: {
				value: '+',
			},
			areacode: {
				value: '65',
			},
			nbr: {
				value: '84000000',
			},
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		marital: {
			unavailable: false,
			code: '2',
			desc: 'MARRIED',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		marriagecertno: {
			unavailable: false,
			value: '123456789012345',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		countryofmarriage: {
			unavailable: false,
			code: 'SG',
			desc: 'SINGAPORE',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		marriagedate: {
			unavailable: false,
			value: '2007-01-01',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		divorcedate: {
			unavailable: false,
			value: '',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		childrenbirthrecords: [
			{
				unavailable: false,
				birthcertno: {
					value: 'S5562882C',
				},
				name: {
					value: 'Jo Tan Pei Ni',
				},
				hanyupinyinname: {
					value: 'Cheng Pei Ni',
				},
				aliasname: {
					value: '',
				},
				hanyupinyinaliasname: {
					value: '',
				},
				marriedname: {
					value: '',
				},
				sex: {
					code: 'F',
					desc: 'FEMALE',
				},
				race: {
					code: 'CN',
					desc: 'CHINESE',
				},
				secondaryrace: {
					code: '',
					desc: '',
				},
				dialect: {
					code: 'HK',
					desc: 'HOKKIEN',
				},
				lifestatus: {
					code: 'D',
					desc: 'DECEASED',
				},
				dob: {
					value: '2011-09-10',
				},
				tob: {
					value: '0901',
				},
				classification: 'C',
				source: '1',
				lastupdated: '2019-03-26',
			},
		],
		sponsoredchildrenrecords: [
			{
				unavailable: false,
				nric: {
					value: 'S5562882C',
				},
				name: {
					value: 'Jo Tan Pei Ni',
				},
				hanyupinyinname: {
					value: 'Cheng Pei Ni',
				},
				aliasname: {
					value: '',
				},
				hanyupinyinaliasname: {
					value: '',
				},
				marriedname: {
					value: '',
				},
				sex: {
					code: 'F',
					desc: 'FEMALE',
				},
				race: {
					code: 'CN',
					desc: 'CHINESE',
				},
				secondaryrace: {
					code: '',
					desc: '',
				},
				dialect: {
					code: 'HK',
					desc: 'HOKKIEN',
				},
				dob: {
					value: '2011-09-10',
				},
				birthcountry: {
					code: 'SG',
					desc: 'SINGAPORE',
				},
				lifestatus: {
					code: 'A',
					desc: 'ALIVE',
				},
				residentialstatus: {
					code: 'C',
					desc: 'CITIZEN',
				},
				nationality: {
					code: 'SG',
					desc: 'SINGAPORE CITIZEN',
				},
				scprgrantdate: {
					value: '2015-06-13',
				},
				classification: 'C',
				source: '1',
				lastupdated: '2019-03-26',
			},
		],
		edulevel: {
			unavailable: false,
			code: '7',
			desc: "BACHELOR'S OR EQUIVALENT",
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		gradyear: {
			unavailable: false,
			value: '2006',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		schoolname: {
			unavailable: false,
			code: 'T07GS3011J',
			desc: 'SIGLAP SECONDARY SCHOOL',
			value: '',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		occupation: {
			unavailable: false,
			value: '',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		employment: {
			unavailable: false,
			value: 'ALPHA',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		passtype: {
			unavailable: false,
			code: 'RPass',
			desc: 'Work Permit',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		passstatus: {
			unavailable: false,
			value: 'Live',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		passexpirydate: {
			unavailable: false,
			value: '2022-12-31',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		employmentsector: {
			unavailable: false,
			value: 'Manufacturing',
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		householdincome: {
			unavailable: false,
			high: {
				value: 5999,
			},
			low: {
				value: 5000,
			},
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		vehicles: [
			{
				vehicleno: {
					value: 'SDF1235A',
				},
				type: {
					value: 'PASSENGER MOTOR CAR',
				},
				iulabelno: {
					value: '',
				},
				make: {
					value: 'TOYOTA',
				},
				model: {
					value: 'COROLLA ALTIS',
				},
				chassisno: {
					value: 'ZC11S1735800',
				},
				engineno: {
					value: 'M13A1837453',
				},
				motorno: {
					value: '',
				},
				yearofmanufacture: {
					value: '2010',
				},
				firstregistrationdate: {
					value: '2010-06-06',
				},
				originalregistrationdate: {
					value: '2010-06-06',
				},
				coecategory: {
					value: 'A - CAR UP TO 1600CC & 97KW (130BHP)',
				},
				coeexpirydate: {
					value: '2020-06-05',
				},
				roadtaxexpirydate: {
					value: '2020-06-05',
				},
				quotapremium: {
					value: 14000.01,
				},
				openmarketvalue: {
					value: 25000.01,
				},
				co2emission: {
					value: 146.01,
				},
				status: {
					code: '1',
					desc: 'LIVE',
				},
				primarycolour: {
					value: 'BLACK',
				},
				secondarycolour: {
					value: 'WHITE',
				},
				attachment1: {
					value: 'DISABLED',
				},
				attachment2: {
					value: 'WITH SUN ROOF',
				},
				attachment3: {
					value: 'SIDE CURTAIN',
				},
				scheme: {
					value: 'REVISED OFF-PEAK CAR',
				},
				thcemission: {
					value: 1.011001,
				},
				coemission: {
					value: 1.100001,
				},
				noxemission: {
					value: 0.011001,
				},
				pmemission: {
					value: 0.007,
				},
				enginecapacity: {
					value: 1600,
				},
				powerrate: {
					value: 1.41,
				},
				effectiveownership: {
					value: '2010-08-31T20:12:12+08:00',
				},
				propellant: {
					value: 'Compressed Natural Gas',
				},
				maximumunladenweight: {
					value: 1500,
				},
				maximumladenweight: {
					value: 1795,
				},
				minimumparfbenefit: {
					value: 8770.01,
				},
				nooftransfers: {
					value: 2,
				},
				vpc: {
					value: '1234567890',
				},
				classification: 'C',
				source: '1',
				lastupdated: '2019-03-26',
				unavailable: false,
			},
		],
		drivinglicence: {
			unavailable: false,
			comstatus: {
				code: 'Y',
				desc: 'ELIGIBLE',
			},
			totaldemeritpoints: {
				value: 0,
			},
			suspension: {
				startdate: {
					value: '',
				},
				enddate: {
					value: '',
				},
			},
			disqualification: {
				startdate: {
					value: '',
				},
				enddate: {
					value: '',
				},
			},
			revocation: {
				startdate: {
					value: '',
				},
				enddate: {
					value: '',
				},
			},
			pdl: {
				validity: {
					code: 'V',
					desc: 'VALID',
				},
				expirydate: {
					value: '2020-06-15',
				},
				classes: [
					{
						class: {
							value: '2A',
						},
					},
					{
						class: {
							value: '3A',
						},
					},
				],
			},
			qdl: {
				validity: {
					code: 'V',
					desc: 'VALID',
				},
				expirydate: {
					value: '2020-06-15',
				},
				classes: [
					{
						class: {
							value: '2A',
						},
						issuedate: {
							value: '2018-06-06',
						},
					},
					{
						class: {
							value: '3A',
						},
						issuedate: {
							value: '2018-06-06',
						},
					},
				],
			},
			photocardserialno: {
				value: '115616',
			},
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		'noa-basic': {
			unavailable: false,
			amount: {
				value: 100000.01,
			},
			yearofassessment: {
				value: '2018',
			},
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		noa: {
			unavailable: false,
			amount: {
				value: 100000.01,
			},
			yearofassessment: {
				value: '2018',
			},
			employment: {
				value: 100000.01,
			},
			trade: {
				value: 0,
			},
			rent: {
				value: 0,
			},
			interest: {
				value: 0,
			},
			taxclearance: {
				value: 'N',
			},
			category: {
				value: 'ORIGINAL',
			},
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		'noahistory-basic': {
			unavailable: false,
			noas: [
				{
					amount: {
						value: 100000.01,
					},
					yearofassessment: {
						value: '2018',
					},
				},
			],
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		noahistory: {
			unavailable: false,
			noas: [
				{
					amount: {
						value: 100000.01,
					},
					yearofassessment: {
						value: '2018',
					},
					employment: {
						value: 100000.01,
					},
					trade: {
						value: 0,
					},
					rent: {
						value: 0,
					},
					interest: {
						value: 0,
					},
					taxclearance: {
						value: 'N',
					},
					category: {
						value: 'ORIGINAL',
					},
				},
			],
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		cpfcontributions: {
			unavailable: false,
			history: [
				{
					date: {
						value: '2016-12-01',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2016-11',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2016-12-12',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2016-12',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2016-12-21',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2016-12',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-01-01',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2016-12',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-01-12',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-01',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-01-21',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-01',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-02-01',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-01',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-02-12',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-02',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-02-21',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-02',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-03-01',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-02',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-03-12',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-03',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-03-21',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-03',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-04-01',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-03',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-04-12',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-04',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-04-21',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-04',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-05-01',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-04',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-05-12',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-05',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-05-21',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-05',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-06-01',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-05',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-06-12',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-06',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-06-21',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-06',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-07-01',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-06',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-07-12',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-07',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-07-21',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-07',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-08-01',
					},
					amount: {
						value: 500,
					},
					month: {
						value: '2017-07',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					date: {
						value: '2017-08-12',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-08',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2017-08-21',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-08',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2017-09-01',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-08',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2017-09-12',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-09',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2017-09-21',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-09',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2017-10-01',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-09',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2017-10-12',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-10',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2017-10-21',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-10',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2017-11-01',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-10',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2017-11-12',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-11',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2017-11-21',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-11',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2017-12-01',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-11',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2017-12-12',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-12',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2017-12-21',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-12',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2018-01-01',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2017-12',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2018-01-12',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2018-01',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					date: {
						value: '2018-01-21',
					},
					amount: {
						value: 750,
					},
					month: {
						value: '2018-01',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
			],
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		cpfemployers: {
			unavailable: false,
			history: [
				{
					month: {
						value: '2016-11',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2016-12',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2016-12',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2016-12',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-01',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-01',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-01',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-02',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-02',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-02',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-03',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-03',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-03',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-04',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-04',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-04',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-05',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-05',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-05',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-06',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-06',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-06',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-07',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-07',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-07',
					},
					employer: {
						value: 'Crystal Horse Invest Pte Ltd',
					},
				},
				{
					month: {
						value: '2017-08',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2017-08',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2017-08',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2017-09',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2017-09',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2017-09',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2017-10',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2017-10',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2017-10',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2017-11',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2017-11',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2017-11',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2017-12',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2017-12',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2017-12',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2018-01',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
				{
					month: {
						value: '2018-01',
					},
					employer: {
						value: 'Delta Marine Consultants PL',
					},
				},
			],
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
		cpfbalances: {
			unavailable: false,
			ma: {
				value: 11470.71,
			},
			oa: {
				value: 1581.48,
			},
			sa: {
				value: 21967.09,
			},
			ra: {
				value: 0.01,
			},
			classification: 'C',
			source: '1',
			lastupdated: '2019-03-26',
		},
	};
};
