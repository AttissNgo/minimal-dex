import { 
    extendTheme, 
    theme as base, 
    withDefaultVariant,
} from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

const inputSelectStyles = {
    variants: {
        filled: (props) => ({
            field: {
                _focus: {
                    borderColor: mode('teal.300', 'mustard.300')(props),
                }
            }
        }),
        outline: (props) => ({
            field: {
                _first: {
                    borderColor: mode('mustard.300', 'teal.900')(props),
                },
                _focus: {
                    ring: 1,
                    ringColor: mode('teal.300', 'mustard.300')(props),
                    borderColor: mode('teal.300', 'mustard.300')(props),
                }
            }
        }),
    }
}

const theme = extendTheme({
    fonts: {
        heading: `Oxygen, ${base.fonts.heading}`,
        body: `Krub, ${base.fonts.body}`,
        button: `Oxygen, sans-serif`,
    },
    colors: {
        teal: {
            100: '#7BE3DC',
            200: '#50DAD1',
            300: '#2CD0C5',
            400: '#25B2A8',
            500: '#1F958D',
            600: '#1B8079',
            700: '#18726C',
            800: '#145D58',
            900: '#0D3F3C',
            1000: '#092A28',
            dark: '#061C1A',
            ultradark: '#030E0D',
        },
        violet: {
            100: '#DC7BE3',
            200: '#D150DA',
            300: '#C52CD0',
            400: '#A825B2',
            500: '#8D1F95',
            600: '#791B80',
            700: '#6C1872',
            800: '#58145D',
            900: '#3C0D3F',
            1000: '#28092A',
            dark: '#1A061C',
            ultradark: '#0D030E',
        },
        mustard: {
            100: '#E3DC7B',
            200: '#DAD150',
            300: '#D0C52C',
            400: '#B2A825',
            500: '#958D1F',
            600: '#80791B',
            700: '#726C18',
            800: '#5D5814',
            900: '#3F3C0D',
            1000: '#2A2809',
            dark: '#1C1A06',
            ultradark: '#0E0D03',
        },
    },
    components: {
        Input: {...inputSelectStyles},
        NumberInput: {...inputSelectStyles},
        NumberInputField: {...inputSelectStyles},
        Select: {...inputSelectStyles},
        Textarea: {...inputSelectStyles},
        Button: {
            variants: {
                primary: (props) => ({
                    fontFamily: 'Oxygen',
                    backgroundColor: mode('violet.400', 'mustard.400')(props),
                    _hover: {
                        backgroundColor: mode('violet.600', 'mustard.300')(props),
                    },
                    _active: {
                        backgroundColor: mode('violet.200', 'mustard.700')(props),
                    },
                    color: mode('#E2E8F0', '#171923')(props),
                })
            },
        },
    },
},
withDefaultVariant({
    variant: 'outline',
    components: ['Input', 'Select'],
}),
);

export default theme;