"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaService = void 0;
const common_1 = require("@nestjs/common");
let MetaService = class MetaService {
    constructor() {
        this.countriesCache = null;
        this.cacheTTL = 1000 * 60 * 60; // 1시간
        this.rateCache = new Map();
        this.rateCacheTTL = 1000 * 60 * 10; // 10분
        this.countriesFetchPromise = null;
        this.ratePromiseCache = new Map();
    }
    mapCountries(payload) {
        return payload
            .filter((country) => Boolean(country.cca2))
            .map((country) => {
            const nameKo = country.translations?.kor?.common ?? country.name?.common ?? country.cca2;
            const nameEn = country.name?.common ?? country.cca2;
            const currencies = Object.keys(country.currencies ?? {});
            return {
                code: country.cca2,
                nameKo,
                nameEn,
                currencies,
            };
        })
            .sort((a, b) => a.nameKo.localeCompare(b.nameKo, 'ko'));
    }
    async getCountries() {
        if (this.countriesCache && this.countriesCache.expiresAt > Date.now()) {
            return this.countriesCache.data;
        }
        if (this.countriesFetchPromise) {
            return this.countriesFetchPromise;
        }
        this.countriesFetchPromise = (async () => {
            const response = await fetch('https://restcountries.com/v3.1/all?fields=cca2,name,translations,currencies');
            if (!response.ok) {
                throw new common_1.ServiceUnavailableException('국가 정보를 가져오지 못했습니다.');
            }
            const payload = (await response.json());
            const mapped = this.mapCountries(payload);
            this.countriesCache = {
                data: mapped,
                expiresAt: Date.now() + this.cacheTTL,
            };
            return mapped;
        })();
        try {
            return await this.countriesFetchPromise;
        }
        finally {
            this.countriesFetchPromise = null;
        }
    }
    async getExchangeRate(baseCurrency, quoteCurrency, baseAmount = 1000) {
        const normalizedBase = baseCurrency.toUpperCase();
        const normalizedQuote = quoteCurrency.toUpperCase();
        const normalizedAmount = baseAmount > 0 ? baseAmount : 1;
        const cacheKey = `${normalizedBase}-${normalizedQuote}`;
        const cached = this.rateCache.get(cacheKey);
        const computeResult = (rateData) => ({
            ...rateData,
            baseAmount: normalizedAmount,
            quoteAmount: rateData.rate * normalizedAmount,
        });
        if (cached && cached.expiresAt > Date.now()) {
            return computeResult(cached.data);
        }
        if (normalizedBase === normalizedQuote) {
            const same = {
                baseCurrency: normalizedBase,
                quoteCurrency: normalizedQuote,
                rate: 1,
                date: new Date().toISOString().slice(0, 10),
            };
            this.rateCache.set(cacheKey, { data: same, expiresAt: Date.now() + this.rateCacheTTL });
            return computeResult(same);
        }
        const existingPromise = this.ratePromiseCache.get(cacheKey);
        if (existingPromise) {
            const rate = await existingPromise;
            return computeResult(rate);
        }
        const ratePromise = (async () => {
            const params = new URLSearchParams({
                from: normalizedBase,
                to: normalizedQuote,
            });
            const response = await fetch(`https://api.frankfurter.app/latest?${params.toString()}`);
            if (!response.ok) {
                throw new common_1.ServiceUnavailableException('환율 정보를 가져오지 못했습니다.');
            }
            const payload = (await response.json());
            const rateValue = payload.rates?.[normalizedQuote];
            if (typeof rateValue !== 'number') {
                throw new common_1.ServiceUnavailableException('요청한 통화쌍 환율이 없습니다.');
            }
            return {
                baseCurrency: normalizedBase,
                quoteCurrency: normalizedQuote,
                rate: rateValue,
                date: payload.date,
            };
        })();
        this.ratePromiseCache.set(cacheKey, ratePromise);
        try {
            const baseResult = await ratePromise;
            this.rateCache.set(cacheKey, { data: baseResult, expiresAt: Date.now() + this.rateCacheTTL });
            return computeResult(baseResult);
        }
        finally {
            this.ratePromiseCache.delete(cacheKey);
        }
    }
};
exports.MetaService = MetaService;
exports.MetaService = MetaService = __decorate([
    (0, common_1.Injectable)()
], MetaService);
