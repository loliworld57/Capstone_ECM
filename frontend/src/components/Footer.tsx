export default function Footer() {
    return (
        <div className="bg-linear-to-r from-indigo-500 from-5% via-[var(--color-main)] via-50% to-indigo-500 to-95%">
            <footer className="container text-[var(--color-soft-white)] flex items-center justify-between px-6 py-2">
                <div>
                    <p className="font-bold">Contact Us:</p>
                    <p>tung.le.cit20@eiu.edu.vn</p>
                    <p>anh.doviet.cit21@eiu.edu.vn</p>
                </div>

                <div>
                    © {new Date().getFullYear()} EIU Capstone Project.
                </div>
            </footer>
        </div>
    );
}