import { useScene } from '../../context/SceneContext';
import { useGalleryProjects, useStudioContent, useAwards } from '../../hooks/useSanityData';
import '../../styles/ScreenReaderOverlay.scss';

/**
 * ScreenReaderOverlay — A7 Accessibility
 * 
 * Invisible HTML layer providing screen reader access to 3D canvas content.
 * Contains buttons/links matching interactive 3D elements (doors, rooms).
 * Visually hidden via .sr-only but fully accessible to assistive tech.
 */

// 房间 ID -> 中文名（用于朗读与提示）
const ROOM_NAMES = {
    about: '关于',
    gallery: '作品集',
    contact: '联系',
    studio: '创作室',
};

const ScreenReaderOverlay = () => {
    const { hasEntered, isInRoom, currentRoom, teleportTo, requestExit } = useScene();
    
    // Pobieranie danych do wygenerowania niewidocznego HTML-a dla SEO / robotów
    const projects = useGalleryProjects();
    const studio = useStudioContent();
    const awards = useAwards();

    return (
        <div className="sr-overlay" role="complementary" aria-label="3D 作品集无障碍导航">
            {/* Skip to content link */}
            <a href="#sr-main-nav" className="sr-only sr-focusable">
                跳到无障碍导航
            </a>

            {/* Main accessible navigation */}
            <nav id="sr-main-nav" className="sr-only" aria-label="作品集房间导航">
                <h1>吴桐 — AI 自媒体创作者 · 3D 作品集</h1>
                <h2>作品集导航</h2>

                {!hasEntered && (
                    <p>欢迎来到吴桐的 3D 交互作品集。点击或按回车键打开房间门进入。</p>
                )}

                {hasEntered && !isInRoom && (
                    <>
                        <p>你现在在走廊里，选择一个房间开始探索：</p>
                        <ul>
                            <li>
                                <button onClick={() => teleportTo('about')} type="button">
                                    关于 — 我的故事、技能与旅程
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('gallery')} type="button">
                                    作品集 — 我的项目与创作
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('contact')} type="button">
                                    联系 — 与我取得联系
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('studio')} type="button">
                                    创作室 — 技术与经验
                                </button>
                            </li>
                        </ul>
                    </>
                )}

                {hasEntered && isInRoom && (
                    <>
                        <p>
                            你现在在{ROOM_NAMES[currentRoom] || currentRoom}房间。
                        </p>
                        <button onClick={requestExit} type="button">
                            返回走廊
                        </button>

                        {/* Room-specific content descriptions */}
                        {currentRoom === 'about' && (
                            <div aria-label="关于房间内容">
                                <h3>关于我</h3>
                                <p>这里是吴桐的故事：三年设计经验，当前定位 AI 设计师，正在走向 AI 独立开发者的路上；Base 长沙，日常运营工作室、打比赛、做自媒体。这个房间展示我的个人故事、奖项、旅程里程碑与以交互式气球呈现的技术技能。</p>
                                
                                {awards && (
                                    <section>
                                        <h4>我的奖项</h4>
                                        <ul>
                                            {awards.sotd && awards.sotd.items && awards.sotd.items.map((a, i) => (
                                                <li key={i}>{a.label} - {a.date} {a.url && <a href={a.url}>查看</a>}</li>
                                            ))}
                                            {awards.sotm && awards.sotm.items && awards.sotm.items.map((a, i) => (
                                                <li key={i}>{a.label} - {a.date} {a.url && <a href={a.url}>查看</a>}</li>
                                            ))}
                                            {awards.other && awards.other.items && awards.other.items.map((a, i) => (
                                                <li key={i}>{a.label} - {a.date} {a.url && <a href={a.url}>查看</a>}</li>
                                            ))}
                                        </ul>
                                    </section>
                                )}
                            </div>
                        )}
                        {currentRoom === 'gallery' && (
                            <div aria-label="作品集房间内容">
                                <h3>我的项目</h3>
                                <p>浏览陈列在纸质卡片上的作品集项目。点击项目卡片可查看详情并访问在线站点。</p>
                                
                                {projects && projects.length > 0 && (
                                    <ul>
                                        {projects.map((p, i) => (
                                            <li key={i}>
                                                <h4>{p.title}</h4>
                                                <p>{p.description}</p>
                                                {p.url && <a href={p.url}>访问 {p.title}</a>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                        {currentRoom === 'contact' && (
                            <div aria-label="联系房间内容">
                                <h3>联系我</h3>
                                <p>联系场景使用 QQ 企鹅、微信和飞书蓝鸟三个漂浮的 3D 模型。点击 QQ 可查看号码 1670935895，点击微信可查看二维码名片，点击飞书可打开我的个人说明书。</p>
                                <p>
                                    <a href="https://my.feishu.cn/wiki/PdgpwD8griJDY9kkQ71c5zufnSH?from=from_copylink">
                                        打开吴桐的飞书个人说明书
                                    </a>
                                </p>
                            </div>
                        )}
                        {currentRoom === 'studio' && (
                            <div aria-label="创作室房间内容">
                                <h3>创作室</h3>
                                <p>内容分为活动策划、Vibe Coding 和视频创作三类。当前已录入四件真实作品，点击旋转屏幕可查看介绍与原始链接。</p>

                                {studio && studio.length > 0 && (
                                    <ul>
                                        {studio.map((s, i) => (
                                            <li key={i}>
                                                <h4>{s.title}（{s.categoryLabel || s.platform}）</h4>
                                                <p>{s.description}</p>
                                                {s.url && <a href={s.url}>查看内容</a>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Quick navigation to other rooms */}
                        <h3>快捷导航</h3>
                        <ul>
                            {currentRoom !== 'about' && (
                                <li><button onClick={() => teleportTo('about')} type="button">前往关于</button></li>
                            )}
                            {currentRoom !== 'gallery' && (
                                <li><button onClick={() => teleportTo('gallery')} type="button">前往作品集</button></li>
                            )}
                            {currentRoom !== 'contact' && (
                                <li><button onClick={() => teleportTo('contact')} type="button">前往联系</button></li>
                            )}
                            {currentRoom !== 'studio' && (
                                <li><button onClick={() => teleportTo('studio')} type="button">前往创作室</button></li>
                            )}
                        </ul>
                    </>
                )}
            </nav>

            {/* Live region for state changes */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {isInRoom && `已进入${ROOM_NAMES[currentRoom] || currentRoom}房间`}
            </div>
        </div>
    );
};

export default ScreenReaderOverlay;
