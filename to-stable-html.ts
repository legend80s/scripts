import path from 'node:path';

import parse5 from 'parse5';
import prettier from 'prettier';

/**
 * - `true`: 过滤掉该属性
 * - `false`: 保留该属性
 * - `string`: 替换该属性值
 */
type IFilter = (
  node: { tagName: string },
  attr: { name: string; value: string }
) => true | false | string;

/**
 * 使用 parse5 过滤 HTML 属性，再用 Prettier 格式化
 * @param html 原始 HTML
 * @param ignoreAttrs 要忽略或替换的属性规则
 * @returns 格式化后的 HTML
 */
function formatAndFilterAttr(
  html: string,
  ignoreAttrs: IFilter
): Promise<string> {
  return format(filter(html, ignoreAttrs));
}

export async function toStableHTML(html: string): Promise<string> {
  const formatted = await formatAndFilterAttr(html.trim(), (node, attr) => {
    const isSrcDiskPath =
      node.tagName === 'img' &&
      attr.name === 'src' &&
      (/^[a-zA-Z]:/.test(attr.value) || attr.value.startsWith('/app/'));

    if (isSrcDiskPath) {
      // D:\\workspace\\foo\\src\\assets\\user-2.png
      // to user-2.png
      // /app/src/assets/submitIcon.png to submitIcon.png
      return `...DISK_PATH/${path.basename(attr.value)}`;
    }

    // 保留，不做处理
    return false;
  });

  return formatted.trim();
}

export async function format(html: string): Promise<string> {
  // console.time("format html using prettier");
  const formatted = await prettier.format(html, {
    parser: 'html',
    htmlWhitespaceSensitivity: 'ignore',
  });
  // console.timeEnd("format html using prettier");

  return formatted.trim();
}

function filter(html: string, ignoreAttrs: IFilter): string {
  // console.time("filter html");
  // 1. 用 parse5 解析 HTML
  const document = parse5.parseFragment(html);

  // 2. 遍历 AST，移除要忽略的属性
  const removeIgnoredAttrs = (node) => {
    if (node.attrs) {
      node.attrs = node.attrs.filter((attr) => {
        const shouldIgnore = ignoreAttrs(node, attr); // 自定义匹配
        let keep = !shouldIgnore;

        if (typeof shouldIgnore === 'boolean') return keep;

        attr.value = shouldIgnore; // 自定义替换
        keep = true;

        return keep;
      });
    }

    if (node.childNodes) {
      node.childNodes.forEach(removeIgnoredAttrs);
    }
  };

  removeIgnoredAttrs(document);

  // 3. 将 AST 重新序列化为 HTML
  const filteredHTML = parse5.serialize(document);

  // console.timeEnd("filter html");

  return filteredHTML;
}
