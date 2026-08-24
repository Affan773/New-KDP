import { KdpKeywordCluster, KdpSeoKeyword } from '../../types/seo';

export interface KeywordClusterGroup {
  cluster: KdpKeywordCluster;
  count: number;
  keywords: string[];
  keywordObjects: KdpSeoKeyword[];
  avgScore: number;
}

export class KeywordClusterService {
  public static readonly DEFAULT_CLUSTERS: KdpKeywordCluster[] = [
    'CORE',
    'AUDIENCE',
    'THEME',
    'FORMAT',
    'DIFFICULTY',
    'USE CASE',
    'LONG-TAIL',
    'GIFT',
  ];

  /**
   * Automatically groups keywords into structured clusters
   */
  public static groupIntoClusters(keywords: KdpSeoKeyword[]): KeywordClusterGroup[] {
    const clusterMap = new Map<string, KdpSeoKeyword[]>();

    for (const kw of keywords) {
      const cluster = kw.cluster || 'CORE';
      if (!clusterMap.has(cluster)) {
        clusterMap.set(cluster, []);
      }
      clusterMap.get(cluster)!.push(kw);
    }

    const result: KeywordClusterGroup[] = [];
    clusterMap.forEach((kws, cluster) => {
      const avg = kws.length > 0
        ? Math.round(kws.reduce((acc, item) => acc + item.studioSeoScore, 0) / kws.length)
        : 0;

      result.push({
        cluster,
        count: kws.length,
        keywords: kws.map(k => k.keyword),
        keywordObjects: kws,
        avgScore: avg,
      });
    });

    // Sort by count descending
    return result.sort((a, b) => b.count - a.count);
  }

  /**
   * Merge one cluster into another
   */
  public static mergeClusters(
    keywords: KdpSeoKeyword[],
    sourceCluster: string,
    targetCluster: string
  ): KdpSeoKeyword[] {
    return keywords.map(kw => {
      if (kw.cluster === sourceCluster) {
        return { ...kw, cluster: targetCluster };
      }
      return kw;
    });
  }

  /**
   * Split selected keyword IDs into a new custom cluster
   */
  public static splitCluster(
    keywords: KdpSeoKeyword[],
    targetIds: string[],
    newClusterName: string
  ): KdpSeoKeyword[] {
    const idSet = new Set(targetIds);
    return keywords.map(kw => {
      if (idSet.has(kw.id)) {
        return { ...kw, cluster: newClusterName.toUpperCase().trim() };
      }
      return kw;
    });
  }

  /**
   * Rename an existing cluster
   */
  public static renameCluster(
    keywords: KdpSeoKeyword[],
    oldName: string,
    newName: string
  ): KdpSeoKeyword[] {
    const cleanNew = newName.toUpperCase().trim();
    if (!cleanNew) return keywords;
    return keywords.map(kw => {
      if (kw.cluster === oldName) {
        return { ...kw, cluster: cleanNew };
      }
      return kw;
    });
  }
}
