/*
👋 Hi! This file was autogenerated by tslint-to-eslint-config.
https://github.com/typescript-eslint/tslint-to-eslint-config

It represents the closest reasonable ESLint configuration to this
project's original TSLint configuration.

We recommend eventually switching this configuration to extend from
the recommended rulesets in typescript-eslint.
https://github.com/typescript-eslint/tslint-to-eslint-config/blob/master/docs/FAQs.md

Happy linting! 💖
*/
module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "extends": [
        "prettier"
        // "prettier/@typescript-eslint"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "eslint-plugin-jsdoc",
        "eslint-plugin-prefer-arrow",
        "eslint-plugin-react",
        "eslint-plugin-import",
        "@typescript-eslint",
        "@typescript-eslint/tslint"
    ],
	"ignorePatterns": [
		"**/node_modules/*",
		"**/__tests__/*",
		"**/__mocks__/*",
		"src/**/*.unit.ts",
		"src/**/*.test.ts",
		"src/**/*.spec.ts",
		"src/**/*.apispec.ts",
		"src/**/*.bench.ts"
	],
    "rules": {
        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/array-type": [
            "error",
            {
                "default": "array"
            }
        ],
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/consistent-type-assertions": "error",
        "@typescript-eslint/dot-notation": "off",	// mol no-string-literal
        "@typescript-eslint/explicit-member-accessibility": [	// mol member-access ? should constructor be private/public?
            "off",
            // {
            //     "accessibility": "explicit",
            //     "overrides": {
            //         "accessors": "explicit"
            //     }
            // }
        ],
        "@typescript-eslint/indent": "off",
        "@typescript-eslint/member-delimiter-style": [
            "off",
            {
                "multiline": {
                    "delimiter": "none",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "semi",
                    "requireLast": false
                }
            }
        ],
        "@typescript-eslint/member-ordering": "off",
        "@typescript-eslint/naming-convention": "off", // need to find replacement for keywords
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-shadow": [
            "error",
            {
                "hoist": "functions"
            }
        ],
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/prefer-for-of": "off",	// turned off
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/quotes": "off",
        "@typescript-eslint/semi": [
            "off",
            null
        ],
        "@typescript-eslint/triple-slash-reference": [
            "error",
            {
                "path": "always",
                "types": "prefer-import",
                "lib": "always"
            }
        ],
        "@typescript-eslint/type-annotation-spacing": "off",
        "@typescript-eslint/unified-signatures": "error",
        "arrow-body-style": "off",
        "arrow-parens": [
            "off",
            "always"
        ],
        "brace-style": [
            "off",
            "off"
        ],
        "comma-dangle": "off",
        "complexity": "off",
        "constructor-super": "error",
        "curly": "off",	// mol
        "eol-last": "off",
        "eqeqeq": [
            "error",
            "smart"
        ],
        "guard-for-in": "off",
        "id-blacklist": [
            "error",
            "any",
            "Number",
            "number",
            "String",
            "string",
            "Boolean",
            "boolean",
            "Undefined",
            "undefined"
        ],
        "id-match": "error",
        "import/order": "error",
		"indent": ["error", "tab"], // mol
        "jsdoc/check-alignment": "error",
        "jsdoc/check-indentation": "error",
        "jsdoc/newline-after-description": "error",
        "linebreak-style": "off",
        "max-classes-per-file": "off",
        "max-len": [2, {"code": 300, "ignoreTemplateLiterals": true}],	// mol max-line-length
        "new-parens": "off",
        "newline-per-chained-call": "off",
        "no-bitwise": "error",
        "no-caller": "error",
        "no-cond-assign": "error",
        "no-console": "error",
        "no-debugger": "error",
        "no-empty": "off",
        "no-eval": "error",
        "no-extra-semi": "off",
        "no-fallthrough": "off",
        "no-invalid-this": "off",
        "no-irregular-whitespace": "off",
        "no-multiple-empty-lines": "off",
        "no-new-wrappers": "error",
        "no-throw-literal": "error",
        "no-trailing-spaces": "off",
        "no-undef-init": "error",
        "no-underscore-dangle": "off",	// turned off
        "no-unsafe-finally": "error",
        "no-unused-labels": "error",
        "no-var": "error",
        "object-shorthand": "error",
        "one-var": [
            "error",
            "never"
        ],
        "prefer-arrow/prefer-arrow-functions": "off",	// ESLint does not support allowing standalone function declarations. ESLint does not support allowing named functions defined with the function keyword.
        "prefer-const": "error",
        "quote-props": "off",
        "radix": "error",
        "react/jsx-curly-spacing": "off",
        "react/jsx-equals-spacing": "off",
        "react/jsx-no-bind": "off",
        "react/jsx-tag-spacing": [
            "off",
            {
                "afterOpening": "allow",
                "closingSlash": "allow"
            }
        ],
        "react/jsx-wrap-multilines": "off",
        "space-before-function-paren": ["error", {
			"anonymous": "always",
			"named": "never",
			"asyncArrow": "always"
		}],
        "space-in-parens": [
            "off",
            "never"
        ],
        "spaced-comment": [
            "error",
            "always",
            {
                "markers": [
                    "/"
                ]
            }
        ],
        "use-isnan": "error",
        "valid-typeof": "off",
        "@typescript-eslint/tslint/config": [
            "error",
            {
                "rules": {
                    "arguments-order": true,
                    "bool-param-default": true,
                    "cognitive-complexity": true,
                    "consecutive-overloads": true,
                    "max-switch-cases": true,
                    "max-union-size": true,
                    "no-accessor-field-mismatch": true,
                    "no-all-duplicated-branches": true,
                    "no-alphabetical-sort": true,
                    "no-array-delete": true,
                    "no-big-function": true,
                    "no-case-with-or": true,
                    "no-circular-imports": true,
                    "no-collapsible-if": true,
                    "no-collection-size-mischeck": true,
                    "no-commented-code": true,
                    "no-dead-store": true,
                    "no-duplicate-in-composite": true,
                    "no-duplicated-branches": true,
                    "no-element-overwrite": true,
                    "no-empty-array": true,
                    "no-empty-destructuring": true,
                    "no-extra-semicolon": true,
                    "no-gratuitous-expressions": true,
                    "no-hardcoded-credentials": true,
                    "no-identical-conditions": true,
                    "no-identical-expressions": true,
                    "no-ignored-initial-value": true,
                    "no-ignored-return": true,
                    "no-in-misuse": true,
                    "no-invariant-return": true,
                    "no-inverted-boolean-check": true,
                    "no-misleading-array-reverse": true,
                    "no-misspelled-operator": true,
                    "no-multiline-string-literals": true,
                    "no-nested-switch": true,
                    "no-nested-template-literals": true,
                    "no-redundant-boolean": true,
                    "no-redundant-jump": true,
                    "no-redundant-parentheses": true,
                    "no-return-type-any": true,
                    "no-same-line-conditional": true,
                    "no-self-assignment": true,
                    "no-small-switch": true,
                    "no-statements-same-line": true,
                    "no-try-promise": true,
                    "no-unconditional-jump": true,
                    "no-undefined-argument": true,
                    "no-unenclosed-multiline-block": true,
                    "no-unthrown-error": true,
                    "no-unused-array": true,
                    "no-use-of-empty-return-value": true,
                    "no-useless-cast": true,
                    "no-useless-catch": true,
                    "no-useless-increment": true,
                    "no-useless-intersection": true,
                    "no-variable-usage-before-declaration": true,
                    "parameters-max-number": true,
                    "prefer-default-last": true,
                    "prefer-optional": true,
                    "prefer-promise-shorthand": true,
                    "prefer-type-guard": true,
                    "prettier": true,
                    "tsr-detect-buffer-noassert": true,
                    "tsr-detect-child-process": true,
                    "tsr-detect-eval-with-expression": true,
                    "tsr-detect-html-injection": true,
                    "tsr-detect-no-csrf-before-method-override": true,
                    "tsr-detect-non-literal-buffer": true,
                    "tsr-detect-non-literal-fs-filename": true,
                    "tsr-detect-non-literal-regexp": true,
                    "tsr-detect-non-literal-require": true,
                    "tsr-detect-possible-timing-attacks": true,
                    "tsr-detect-pseudo-random-bytes": true,
                    "tsr-detect-sql-literal-injection": true,
                    "tsr-detect-unsafe-cross-origin-communication": true,
                    "tsr-detect-unsafe-properties-access": true,
                    "tsr-detect-unsafe-regexp": true,
                    "tsr-disable-mustache-escape": true,
                    "use-primitive-type": true,
                    "use-type-alias": true
                }
            }
        ]
    }
};
