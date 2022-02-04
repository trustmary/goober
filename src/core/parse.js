/**
 * Parses the object into css, scoped, blocks
 * @param {Object} obj
 * @param {String} selector
 * @param {String} tag
 * @param {Boolean} disablePrefix
 */
export let parse = (obj, selector, tag, disablePrefix) => {
    let outer = '';
    let blocks = '';
    let current = '';

    const prefixedSelector = !disablePrefix && parse.sp ? parse.sp(selector, tag) : selector;

    for (let key in obj) {
        let val = obj[key];

        if (key[0] == '@') {
            // If these are the `@` rule
            if (key[1] == 'i') {
                // Handling the `@import`
                outer = key + ' ' + val + ';';
            } else if (key[1] == 'f') {
                // Handling the `@font-face` where the
                // block doesn't need the brackets wrapped
                blocks += parse(val, key, undefined, true);
            } else {
                const dp = key.substring(0, 6) !== '@media';
                // Regular at rule block
                blocks +=
                    key + '{' + parse(val, key[1] == 'k' ? '' : selector, undefined, dp) + '}';
            }
        } else if (typeof val == 'object') {
            // Call the parse for this block
            blocks += parse(
                val,
                selector
                    ? // Go over the selector and replace the matching multiple selectors if any
                      selector.replace(/([^,])+/g, (sel) => {
                          // Return the current selector with the key matching multiple selectors if any
                          return key.replace(/(^:.*)|([^,])+/g, (k) => {
                              // If the current `k`(key) has a nested selector replace it
                              if (/&/.test(k)) return k.replace(/&/g, sel);

                              // If there's a current selector concat it
                              return sel ? sel + ' ' + k : k;
                          });
                      })
                    : key,
                undefined,
                disablePrefix
            );
        } else if (val != undefined) {
            // If this isn't an empty rule
            key = key.replace(/[A-Z]/g, '-$&').toLowerCase();
            // Push the line for this property
            current += parse.p
                ? // We have a prefixer and we need to run this through that
                  parse.p(key, val)
                : // Nope no prefixer just append it
                  key + ':' + val + ';';
        }
    }

    // If we have properties apply standard rule composition
    return (
        outer +
        (prefixedSelector && current ? prefixedSelector + '{' + current + '}' : current) +
        blocks
    );
};
